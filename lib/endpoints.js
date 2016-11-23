var
	_       = require('lodash'),
	assert  = require('assert'),
	domain  = require('domain'),
	http    = require('http'),
	P       = require('p-promise'),
	restify = require('restify'),
	uuid    = require('uuid'),
	muxer   = require('./keymuxer')
	;

var mesh;

exports.createServer = function createServer(opts)
{
	assert(opts && opts.mesh, 'you must pass an options object with a mesh');

	var server = restify.createServer(opts);
	mesh = opts.mesh;

	server.use(domainWrapper);
	server.use(restify.requestLogger());
	server.use(restify.acceptParser(server.acceptable));
	server.use(restify.queryParser());
	server.use(restify.gzipResponse());
	server.use(extractTTLHeader);
	server.use(logEachRequest);
	server.use(restify.conditionalRequest());

	server.get('/ping', handlePing);
	server.get('/health', handleHealth);

	server.get('/:bucket', handleGetBucket);
	server.post('/:bucket', handlePostBucket);
	server.put('/:bucket/:id', handlePutItem);
	server.get('/:bucket/:id', handleGetItem);
	server.head('/:bucket/:id', handleGetItem);
	server.del('/:bucket/:id', handleDelItem);

	return server;
};

function domainWrapper(request, response, next)
{
	var d = domain.create();
	d.on('error', function(err)
	{
		request.log.error(err);
	});
	d.run(next);
}

function logEachRequest(request, response, next)
{
	request.log.info(request.method, request.url);
	next();
}

function extractTTLHeader(request, response, next)
{
	var headers = request.headers;
	if (headers['x-scurry-ttl'])
	{
		var ttl = parseInt(headers['x-scurry-ttl'], 10);
		if (!isNaN(ttl))
			request.ttl = ttl * 1000; // seconds -> milliseconds
	}

	next();
}

function proxyRequest(remote, request, response, next)
{
	var options = {};
	options.path = request._url.pathname;
	options.headers = request.headers;
	options.method = request.method;
	options.host = remote.host;
	options.port = remote.port;
	options.headers['accept-encoding'] = undefined;

	var relay = http.request(options, function(relayResponse)
	{
		response.header('transfer-encoding', 'chunked');
		response.writeHeader(relayResponse.statusCode, relayResponse.headers);
		relayResponse.pipe(response);
		relayResponse.on('end', function()
		{
			next();
		});
	});
	request.pipe(relay);
}

function collectBody(request)
{
	var deferred = P.defer();

	var body;
	request.on('data', function(data)
	{
		if (body)
			body = Buffer.concat(body, data);
		else
			body = data;
	});
	request.on('end', function()
	{
		deferred.resolve(body);
	});
	request.on('error', function(err)
	{
		deferred.reject(err);
	});

	return deferred.promise;
}

function handlePing(request, response, next)
{
	response.send(200, 'pong');
	next();
}

function handleHealth(request, response, next)
{
	response.send(200, 'unimplemented');
	next();
}

function makeRequest(remote, uri, method, callback)
{
	var options = {};
	options.path = uri;
	options.method = method;
	options.host = remote.host;
	options.port = remote.port;

	var req = http.request(options, callback);
	req.end();
}

function handleGetBucket(request, response, next)
{
	if (request.params.keys)
		return handleGetKeyStream(request, response, next);

	var bucket = request.params.bucket;

	var uri = '/' + encodeURIComponent(bucket) + '?keys=true';
	var nodehash = mesh.nodes();
	var keystreams = [];
	var count = 0;

	_.each(Object.keys(nodehash), function(k)
	{
		var node = nodehash[k];
		if (node.isremote)
		{
			makeRequest(node, uri, 'GET', function(rez)
			{
				keystreams.push(rez);
				count--;
				if (count === 0)
					startMuxing();
			});
			count++;
		}
		else
		{
			keystreams.push(node.keys(bucket));
		}
	});

	function startMuxing()
	{
		muxer.muxStreams(keystreams).pipe(response);
	}
}

function handleGetKeyStream(request, response, next)
{
	var bucket = request.params.bucket;
	if (!bucket || !bucket.length)
	{
		response.send(400);
		return next();
	}

	var keystream = mesh.mynode.keys(request.params.bucket);
	keystream.pipe(response);
	keystream.on('end', function()
	{
		next();
	});
}

function handlePostBucket(request, response, next)
{
	var id = uuid.v4();
	var bucket = request.params.bucket;
	var node = mesh.locate(bucket, id);

	if (node.isremote)
	{
		// note slight hackery to send along our generated id!
		request._url.pathname += '/' + id;
		request.log.info('relaying to ' + node.id);
		proxyRequest(node, request, response, next);
		return;
	}

	request.log.info('handling locally');
	collectBody(request)
	.then(function(body)
	{
		return node.set(bucket, id, body, { ttl: request.ttl, 'content-type': request.headers['content-type'] });
	})
	.then(function(reply)
	{
		response.send(201, id);
		next();
	})
	.fail(function(err)
	{
		next(err);
	}).done();
}

function handlePutItem(request, response, next)
{
	var id = request.params.id;
	var bucket = request.params.bucket;
	var node = mesh.locate(bucket, id);

	if (node.isremote)
	{
		request.log.info('relaying to ' + node.id);
		proxyRequest(node, request, response, next);
		return;
	}

	request.log.info('handling locally');

	collectBody(request).then(function(body)
	{
		return node.set(bucket, id, body, { ttl: request.ttl, 'content-type': request.headers['content-type'] });
	}).then(function(reply)
	{
		response.send(204);
		next();
	}).fail(function(err)
	{
		next(err);
	}).done();
}

function handleGetItem(request, response, next)
{
	var id = request.params.id;
	var bucket = request.params.bucket;
	var node = mesh.locate(bucket, id);

	if (node.isremote)
	{
		request.log.info('relaying to ' + node.id);
		proxyRequest(node, request, response, next);
		return;
	}

	request.log.info('handling locally');
	node.get(bucket, id).then(function(value)
	{
		if (value)
		{
			response.header('ETag', value.etag);
			response.header('Last-Modified', new Date(value.ts));
			if (value['content-type'])
				response.header('content-type', value['content-type']);
			response.send(200, new Buffer(value.payload, 'base64').toString());
		}
		else
			response.send(404);
		next();
	}).fail(function(err)
	{
		next(err);
	}).done();
}

function handleDelItem(request, response, next)
{
	var id = request.params.id;
	var bucket = request.params.bucket;
	var node = mesh.locate(bucket, id);

	if (node.isremote)
	{
		request.log.info('relaying to ' + node.id);
		proxyRequest(node, request, response, next);
		return;
	}

	request.log.info('handling locally');
	node.del(bucket, id)
	.then(function()
	{
		response.send(204);
		next();
	})
	.fail(function(err)
	{
		next(err);
	}).done();
}
