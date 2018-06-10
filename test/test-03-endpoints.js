/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	endpoints = require('../lib/endpoints'),
	MockMesh  = require('./mocks/mesh'),
	http      = require('http')
	;

function requestFromTestServer(opts, payload, collect, callback)
{
	opts.host =   'localhost';
	opts.port =   4000;
	opts.headers = { 'content-type': 'application/json' };

	var req = http.request(opts, response =>
	{
		if (!collect)
			return callback(null, response);

		var body;
		response.on('data', data =>
		{
			if (body)
				body = Buffer.concat(body, data);
			else
				body = data;
		});
		response.on('end', () =>
		{
			callback(null, response, JSON.parse(body));
		});
		response.on('error', err =>
		{
			callback(err, response);
		});
	}).on('error', err =>
	{
		callback(err);
	});

	if (payload)
		req.write(payload);
	req.end();
}

var mesh = new MockMesh({ count: 5 });

describe('REST api', () =>
{
	var server;
	var obj1 = { name: 'I am a test value.' };
	var id1;

	describe('createServer()', () =>
	{
		it('demands an options object with a mesh', () =>
		{
			function shouldThrow()
			{
				var m = endpoints.createServer();
				m.must.exist();
			}
			shouldThrow.must.throw(Error);
		});

		it('createServer() returns a configured restify server', () =>
		{
			var s = endpoints.createServer({ mesh });
			s.name.must.equal('restify');
			s.routes.must.exist();
			s.chain.must.exist();
		});

		it('has custom middleware for scurry', () =>
		{
			var s = endpoints.createServer({ mesh });
			var middleware = s.chain;
			middleware[0].name.must.equal('domainWrapper');
			middleware[5].name.must.equal('extractTTLHeader');
		});

		it('listens on the given port', done =>
		{
			server = endpoints.createServer({ mesh, name: 'unittests' });
			server.listen(4000);

			var opts =
			{
				path: '/ping',
				method: 'GET'
			};
			requestFromTestServer(opts, null, true, (err, response, body) =>
			{
				demand(err).must.not.exist();
				response.statusCode.must.equal(200);
				body.must.equal('pong');
				done();
			});
		});
	});

	describe('POST /:bucket', () =>
	{
		it('demands JSON data');
		it('has tests for bogus requests, e.g., bad form data');

		it('stores the posted object in the mesh', done =>
		{
			var opts =
			{
				path:   '/test',
				method: 'POST',
			};

			requestFromTestServer(opts, JSON.stringify(obj1), true, (err, response, body) =>
			{
				demand(err).not.exist();
				response.statusCode.must.equal(201);
				body.must.exist();
				body.must.be.a.string();
				id1 = body;
				done();
			});
		});
	});

	describe('PUT /:bucket/:id', () =>
	{
		it('demands JSON data');

		it('stores the posted object in the given bucket & key', done =>
		{
			var opts =
			{
				path:   '/test/1',
				method: 'PUT',
			};

			requestFromTestServer(opts, JSON.stringify(obj1), false, (err, response) =>
			{
				demand(err).not.exist();
				response.statusCode.must.equal(204);

				var node = mesh.locate('test', '1');
				node, 'mock mesh failure, no node'.must.exist();
				node.get('test', '1')
					.then(v =>
					{
						v.must.exist();
						done();
					})
					.fail(err =>
					{
						console.log(err);
						demand(err).not.exist();
					}).done();
			});
		});

	});

	describe('GET /:bucket/:id', () =>
	{
		var previousEtag;

		it('GET sends back an ETag header', done =>
		{
			var opts =
			{
				path:   '/test/1',
				method: 'GET',
			};

			requestFromTestServer(opts, null, true, (err, response, body) =>
			{
				demand(err).not.exist();
				response.statusCode.must.equal(200);
				body.must.exist();
				var headers = response.headers;
				headers.etag.must.exist();
				headers.etag.must.be.a.string();

				previousEtag = headers.etag;
				done();
			});

		});

		it('GET sends back the same ETag header for unchanged data', done =>
		{
			var opts =
			{
				path:   '/test/1',
				method: 'GET',
			};

			requestFromTestServer(opts, null, true, (err, response) =>
			{
				demand(err).not.exist();
				response.statusCode.must.equal(200);
				response.headers.etag.must.equal(previousEtag);
				done();
			});
		});

		it('GET sends a last-modified header');
	});

	describe('HEAD /:bucket/:id', () =>
	{
		it('has tests');

		it('responds with headers for an item', done =>
		{
			var opts =
			{
				path:   '/test/1',
				method: 'HEAD',
			};

			requestFromTestServer(opts, null, false, (err, response) =>
			{
				demand(err).not.exist();
				response.statusCode.must.equal(200);
				var headers = response.headers;
				headers.etag.must.exist();
				headers['last-modified'].must.exist();
				headers['content-type'].must.exist();
				done();
			});
		});
	});

	describe('GET /:bucket', () =>
	{
		it('?keys=true responds with a key stream', done =>
		{
			var opts =
			{
				path:   '/test?keys=true',
				method: 'GET',
			};

			requestFromTestServer(opts, null, false, (err, response) =>
			{
				demand(err).not.exist();
				response.statusCode.must.equal(200);
				var count = 0;

				response.on('data', chunk =>
				{
					count++;
					// console.log(chunk);
				});

				response.on('end', () =>
				{
					// count.must.equal(2);
					done();
				});
			});

		});

		it('responds with a complete key stream from all nodes');
		it('responds with a key stream in lexical order');

	});

	describe('DEL /:bucket/:id', () =>
	{
		it('has tests');

		it('removes the specified object from the mesh', done =>
		{
			var opts =
			{
				path:   '/test/1',
				method: 'DELETE',
			};

			requestFromTestServer(opts, null, false, (err, response) =>
			{
				demand(err).not.exist();
				response.statusCode.must.equal(204);

				var node = mesh.locate('test', '1');
				node, 'mock mesh failure, no node'.must.exist();
				node.get('test', '1')
					.then(v =>
					{
						demand(v).not.exist();
						done();
					})
					.fail(err =>
					{
						demand(err).not.exist();
					}).done();
			});
		});
	});

});
