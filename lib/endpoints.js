// Restful endpoints that let you GET/POST/PUT/PATCH/DELETE objects
// use restify to build this

var
	domain  = require('domain'),
	restify = require('restify'),
	uuid    = require('node-uuid')
	;

var database;

exports.createServer = function createServer(opts)
{
	var server = restify.createServer(opts);

	server.use(domainWrapper);
	server.use(restify.acceptParser(server.acceptable));
	server.use(restify.queryParser());
	server.use(restify.gzipResponse());
	server.use(restify.bodyParser());

	server.get('/:bucket', handleGetBucket);
	server.post('/:bucket', handlePostBucket);
	server.post('/:bucket/:id', handlePostItem);
	server.put('/:bucket/:id', handlePutItem);
	server.get('/:bucket/:id', handleGetItem);
	server.head('/:bucket/:id', handleGetItem);
	server.del('/:bucket/:id', handleDelItem);

	return server;
};

exports.setStorage = function setDB(db)
{
	database = db;
};

function domainWrapper(request, response, next)
{
	var d = domain.create();
	d.run(next);
}

function handleGetBucket(request, response, next)
{
	var bucket = database.sublevel(request.params.bucket);
	var keystream = bucket.createKeyStream();
	keystream.pipe(response);
	keystream.on('end', function()
	{
		return next();
	});
}

function handlePostBucket(request, response, next)
{
	var id = uuid.v4();
	var bucket = database.sublevel(request.params.bucket);

	bucket.put(id, request.body, function(err)
	{
		if (err) return next(err);
		response.send(201, id);
		return next();
	});
}

function handlePostItem(request, response, next)
{
	var id = request.params.id;
	var bucket = database.sublevel(request.params.bucket);

	bucket.put(id, request.body, function(err)
	{
		if (err) return next(err);
		response.send(200, id);
		return next();
	});
}

function handlePutItem(request, response, next)
{
	var id = request.params.id;
	var bucket = database.sublevel(request.params.bucket);

	bucket.put(id, request.body, function(err)
	{
		if (err) return next(err);
		response.send(204);
		return next();
	});
}

function handleGetItem(request, response, next)
{
	var bucket = database.sublevel(request.params.bucket);
	bucket.get(request.params.id, function(err, value)
	{
		if (err) return next(err);
		if (value)
			response.send(200, value);
		else
			response.send(404);
		return next();
	});
}

function handleDelItem(request, response, next)
{
	var id = request.params.id;
	var bucket = database.sublevel(request.params.bucket);

	bucket.del(id, function(err)
	{
		if (err) return next(err);
		response.send(204);
		return next();
	});
}
