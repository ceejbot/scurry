// Restful endpoints that let you GET/POST/PUT/PATCH/DELETE objects
// use restify to build this

var
	assert  = require('assert'),
	domain  = require('domain'),
	http    = require('http'),
	P       = require('p-promise'),
	restify = require('restify'),
	uuid    = require('node-uuid')
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
			request.ttl = ttl;
	}

	next();
}

function proxyRequest(remote, request, response, next)
{
	var options = {};
	options.path    = request._url.pathname;
	options.headers = request.headers;
	options.method  = request.method;
	options.host    = remote.host;
	options.port    = remote.port;
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

function handleGetBucket(request, response, next)
{
	// This is going to require some thought to make work, because
	// the keys will be scattered across many shards.
	// The interesting property of leveldb is that the keys are
	// sorted; is that preservable?

	// ANSWER: Yes. This node will initiate calls to all remote nodes asking for
	// keys, then mux them all together. Sorting will require buffering at least
	// partially. Some juggling required.

	request.log.info('GET keystream for ' + request.params.bucket);

	var keystream = storage.keys(request.params.bucket);
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
		request._url.pathname += ('/' + id);
		request.log.info('relaying to ' + node.id);
		proxyRequest(node, request, response, next);
		return;
	}

	request.log.info('handling locally');
	collectBody(request)
	.then(function(body)
	{
		return node.set(bucket, id, body, request.ttl);
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

	collectBody(request)
	.then(function(body)
	{
		return node.set(bucket, id, body, request.ttl);
	})
	.then(function(reply)
	{
		response.send(204);
		next();
	})
	.fail(function(err)
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
	node.get(bucket, id)
	.then(function(value)
	{
		if (value)
		{
			response.header('ETag', value.etag);
			response.header('Last-Modified', new Date(value.ts));
			response.send(200, new Buffer(value.payload, 'base64').toString('utf8'));
		}
		else
			response.send(404);
		next();
	})
	.fail(function(err)
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
