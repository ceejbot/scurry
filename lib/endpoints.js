// Restful endpoints that let you GET/POST/PUT/PATCH/DELETE objects
// use restify to build this

var
	domain  = require('domain'),
	restify = require('restify'),
	uuid    = require('node-uuid')
	;

var storage;

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

exports.setStorage = function setStorage(db)
{
	storage = db;
};

function domainWrapper(request, response, next)
{
	var d = domain.create();
	d.run(next);
}

function handleGetBucket(request, response, next)
{
	storage.keyStreamFor(request.params.bucket);
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

	storage.save(bucket, id, request.body)
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

function handlePostItem(request, response, next)
{
	var id = request.params.id;
	var bucket = request.params.bucket;

	storage.save(bucket, id, request.body)
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

	storage.save(bucket, id, request.body)
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

	storage.get(bucket, id)
	.then(function(value)
	{
		if (value)
			response.send(200, value);
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

	storage.del(bucket, id)
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
