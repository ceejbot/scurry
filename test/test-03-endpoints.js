/*global describe:true, it:true, before:true, after:true */

var
	chai       = require('chai'),
	assert     = chai.assert,
	// expect     = chai.expect,
	should     = chai.should()
	;

var
	endpoints = require('../lib/endpoints'),
	MockMesh  = require('./mocks/mesh'),
	http      = require('http')
	;

function requestFromTestServer(opts, payload, collect, callback)
{
	opts.host =   'localhost';
	opts.port =   4000;
	opts.headers = { 'content-type': 'application/json' };

	var req = http.request(opts, function(response)
	{
		if (!collect)
			return callback(null, response);

		var body;
		response.on('data', function(data)
		{
			if (body)
				body = Buffer.concat(body, data);
			else
				body = data;
		});
		response.on('end', function()
		{
			callback(null, response, JSON.parse(body));
		});
		response.on('error', function(err)
		{
			callback(err, response);
		});
	}).on('error', function(err)
	{
		callback(err);
	});

	if (payload)
		req.write(payload);
	req.end();
}

var mesh = new MockMesh({ count: 5 });

describe('REST api', function()
{
	var server;
	var obj1 = { name: 'I am a test value.' };
	var id1;

	describe('createServer()', function()
	{
		it('demands an options object with a mesh', function()
		{
			function shouldThrow()
			{
				var m = endpoints.createServer();
				assert.ok(m);
			}
			shouldThrow.should.throw(Error);
		});

		it('createServer() returns a configured restify server', function()
		{
			var s = endpoints.createServer({ mesh: mesh });
			assert.equal(s.name, 'restify');
			assert.ok(s.routes);
			assert.ok(s.chain);
		});

		it('has custom middleware for scurry', function()
		{
			var s = endpoints.createServer({ mesh: mesh });
			var middleware = s.chain;
			assert.equal(middleware[0].name, 'domainWrapper');
			assert.equal(middleware[5].name, 'extractTTLHeader');
		});

		it('listens on the given port', function(done)
		{
			server = endpoints.createServer({ mesh: mesh, name: 'unittests' });
			server.listen(4000);

			var opts =
			{
				path: '/ping',
				method: 'GET'
			};
			requestFromTestServer(opts, null, true, function(err, response, body)
			{
				should.not.exist(err);
				assert.equal(response.statusCode, 200);
				assert.equal(body, 'pong');
				done();
			});
		});
	});

	describe('POST /:bucket', function()
	{
		it('demands JSON data');
		it('has tests for bogus requests, e.g., bad form data');

		it('stores the posted object in the mesh', function(done)
		{
			var opts =
			{
				path:   '/test',
				method: 'POST',
			};

			requestFromTestServer(opts, JSON.stringify(obj1), true, function(err, response, body)
			{
				should.not.exist(err);
				assert.equal(response.statusCode, 201);
				assert.ok(body);
				assert.equal(typeof body, 'string');
				id1 = body;
				done();
			});
		});
	});

	describe('PUT /:bucket/:id', function()
	{
		it('demands JSON data');

		it('stores the posted object in the given bucket & key', function(done)
		{
			var opts =
			{
				path:   '/test/1',
				method: 'PUT',
			};

			requestFromTestServer(opts, JSON.stringify(obj1), false, function(err, response)
			{
				should.not.exist(err);
				assert.equal(response.statusCode, 204);

				var node = mesh.locate('test', '1');
				assert.ok(node, 'mock mesh failure, no node');
				node.get('test', '1')
				.then(function(v)
				{
					assert.ok(v);
					done();
				})
				.fail(function(err)
				{
					console.log(err);
					should.not.exist(err);
				}).done();
			});
		});

	});

	describe('GET /:bucket/:id', function()
	{
		var previousEtag;

		it('GET sends back an ETag header', function(done)
		{
			var opts =
			{
				path:   '/test/1',
				method: 'GET',
			};

			requestFromTestServer(opts, null, true, function(err, response, body)
			{
				should.not.exist(err);
				assert.equal(response.statusCode, 200);
				assert.ok(body);
				var headers = response.headers;
				assert.ok(headers.etag);
				assert.equal(typeof headers.etag, 'string');

				previousEtag = headers.etag;
				done();
			});

		});

		it('GET sends back the same ETag header for unchanged data', function(done)
		{
			var opts =
			{
				path:   '/test/1',
				method: 'GET',
			};

			requestFromTestServer(opts, null, true, function(err, response)
			{
				should.not.exist(err);
				assert.equal(response.statusCode, 200);
				assert.equal(response.headers.etag, previousEtag);
				done();
			});
		});

		it('GET sends a last-modified header');
	});

	describe('HEAD /:bucket/:id', function()
	{
		it('has tests');

		it('responds with headers for an item', function(done)
		{
			var opts =
			{
				path:   '/test/1',
				method: 'HEAD',
			};

			requestFromTestServer(opts, null, false, function(err, response)
			{
				should.not.exist(err);
				assert.equal(response.statusCode, 200);
				var headers = response.headers;
				assert.ok(headers.etag);
				assert.ok(headers['last-modified']);
				assert.ok(headers['content-type']);
				done();
			});
		});
	});

	describe('GET /:bucket', function()
	{
		it('?keys=true responds with a key stream', function(done)
		{
			var opts =
			{
				path:   '/test?keys=true',
				method: 'GET',
			};

			requestFromTestServer(opts, null, false, function(err, response)
			{
				should.not.exist(err);
				assert.equal(response.statusCode, 200);
				var count = 0;

				response.on('data', function(chunk)
				{
					count++;
					// console.log(chunk);
				});

				response.on('end', function()
				{
					// assert.equal(count, 2);
					done();
				});
			});

		});

		it('responds with a complete key stream from all nodes');
		it('responds with a key stream in lexical order');

	});

	describe('DEL /:bucket/:id', function()
	{
		it('has tests');

		it('removes the specified object from the mesh', function(done)
		{
			var opts =
			{
				path:   '/test/1',
				method: 'DELETE',
			};

			requestFromTestServer(opts, null, false, function(err, response)
			{
				should.not.exist(err);
				assert.equal(response.statusCode, 204);

				var node = mesh.locate('test', '1');
				assert.ok(node, 'mock mesh failure, no node');
				node.get('test', '1')
				.then(function(v)
				{
					should.not.exist(v);
					done();
				})
				.fail(function(err)
				{
					console.log(err);
					should.not.exist(err);
				}).done();
			});
		});
	});

});
