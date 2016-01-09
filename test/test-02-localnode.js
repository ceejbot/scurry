/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	rimraf = require('rimraf'),
	fs     = require('fs')
	;

var LocalNode = require('../lib/localnode');

function nodeFixture()
{
	var opts = { id: 'test-id', dbpath: './test/t3', checkFrequency: 500 };
	var node = new LocalNode(opts);

	return node;
}

describe('LocalNode', function()
{
	var node = nodeFixture();

	describe('constructor', function()
	{
		it('throws if no options passed', function()
		{
			function shouldThrow()
			{
				var node = new LocalNode();
			}
			shouldThrow.must.throw(/options/);
		});

		it('throws if no ID passed', function()
		{
			function shouldThrow()
			{
				var node = new LocalNode({ foo: 'bar' });
			}
			shouldThrow.must.throw(/ID/);
		});

		it('throws if no dbpath passed', function()
		{
			function shouldThrow()
			{
				var node = new LocalNode({ id: 'bar' });
			}
			shouldThrow.must.throw(/dbpath/);
		});

		it('can construct a node when passed the required options', function(done)
		{
			var opts =
			{
				id: 'test-id',
				dbpath: './test/t1',
				logger: 'not-a-logger-yet'
			};

			var node = new LocalNode(opts);
			node.id.must.equal(opts.id);
			node.logger.must.equal(opts.logger);
			node.db.must.exist();
			node.db.close(done);
		});

		it('creates the dbpath if needed', function(done)
		{
			fs.existsSync('./test/t2').must.be.false();
			var opts = { id: 'test-id', dbpath: './test/t2' };
			var node = new LocalNode(opts);

				fs.existsSync('./test/t2').must.be.true();
				node.db.close(done);
		});

		it('wraps the db with level-sublevel', function(done)
		{
			var opts = { id: 'test-id', dbpath: './test/t1' };
			var node = new LocalNode(opts);
			var db = node.db;

			db.sublevel, 'db has not been sublevel-ified'.must.exist();
			db.sublevel.must.be.a.function();
			db.close(done);
		});

		it('wraps the db with level-ttl', function(done)
		{
			var opts = { id: 'test-id', dbpath: './test/t1' };
			var node = new LocalNode(opts);
			var db = node.db;

			db.must.have.property('ttl');
			db.ttl.must.be.a.function();
			db.close(done);
		});
	});

	describe('set()', function()
	{
		it('requires that you pass a string bucket', function()
		{
			function shouldThrow()
			{
				node.set();
			}
			shouldThrow.must.throw(Error);
		});

		it('requires that you pass a string id', function()
		{
			function shouldThrow()
			{
				node.set('bucket');
			}
			shouldThrow.must.throw(Error);
		});

		it('returns a promise', function(done)
		{
			var result = node.set('bucket', '1', 'I am a value.');
			result.must.have.property('then');
			result.then.must.be.a.function();

			result.then(function(reply)
			{
				reply.must.equal('OK');
				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			}).done();
		});

		it('stores an object with crc & modification timestamp', function(done)
		{
			node.get('bucket', '1')
			.then(function(result)
			{
				result.must.exist();
				result.must.be.an.object();
				result.must.have.property('ts');
				result.ts.must.be.a.number();
				result.must.have.property('etag');
				result.must.have.property('payload');
				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});

		it('stores strings successfully', function(done)
		{
			node.get('bucket', '1')
			.then(function(result)
			{
				result.must.be.an.object();
				result.must.have.property('payload');
				result.payload.must.be.a.string();
				result.payload.must.be.a.string();
				result.payload.must.equal('I am a value.');

				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});

		it('stores buffers successfully', function(done)
		{
			var buf = new Buffer(8);
			buf.fill(1);

			node.set('bucket', '2', buf)
			.then(function()
			{
				return node.get('bucket', '2');
			})
			.then(function(result)
			{
				result.payload, 'no payload holding the value'.must.exist();
				Buffer.isBuffer(result.payload).must.be.true();
				result.payload.length.must.equal(8);
				result.payload[0].must.equal(1);
				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});

		it('stores objects successfully', function(done)
		{
			var value =
			{
				foo: 'foo',
				bar: 'bar',
				baz: ['hunt', 'the', 'wumpus']
			};

			node.set('bucket', '3', value)
			.then(function()
			{
				return node.get('bucket', '3');
			})
			.then(function(result)
			{
				var stored = result.payload;
				stored.must.be.an.object();
				stored.foo.must.exist();
				stored.foo.must.equal('foo');
				stored.bar.must.exist();
				stored.bar.must.equal('bar');
				stored.baz.must.exist();
				stored.baz.must.be.an.array();
				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});

		it('stores binary data successfully', function(done)
		{
			fs.readFile('./test/mocks/data.png', function(err, data)
			{
				demand(err).not.exist();
				node.set('bucket', '4', data, { 'content-type': 'image/png' })
				.then(function()
				{
					return node.get('bucket', '4');
				})
				.then(function(result)
				{
					result.must.have.property('payload');
					Buffer.isBuffer(result.payload).must.be.true();
					result['content-type'].must.equal('image/png', 'content type was not stored');
					done();
				})
				.fail(function(err)
				{
					demand(err).not.exist();
				})
				.done();
			});
		});

	});

	describe('get()', function()
	{
		it('returns a promise', function()
		{
			var result = node.get('bucket', '1');
			result.must.have.property('then');
			result.then.must.be.a.function();
		});

		it('can fetch a previously-stored value', function(done)
		{
			node.get('bucket', '1')
			.then(function(result)
			{
				result.must.exist();
				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});

		it('returns an empty value for non-existent keys', function(done)
		{
			node.get('bucket', '12')
			.then(function(result)
			{
				demand(result).be.null();
				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});
	});

	describe('del()', function()
	{
		it('returns a promise', function()
		{
			var result = node.del('bucket', '1');
			result.must.have.property('then');
			result.then.must.be.a.function();
		});

		it('removes an item from storage', function(done)
		{
			node.get('bucket', '1')
			.then(function(result)
			{
				demand(result).be.null();
				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});

		it('is silent when removing an item that does not exist', function(done)
		{
			node.del('bucket', '1')
			.then(function(reply)
			{
				reply.must.exist();
				reply.must.equal('OK');
				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});
	});

	describe('TTLs', function()
	{
		it('can set a TTL on a key', function(done)
		{
			this.timeout(4000);
			function checkKey()
			{
				node.get('bucket', '4')
				.then(function(value)
				{
					demand(value).be.null();
					done();
				}).done();
			}

			node.set('bucket', '4', 'dead value walking', { ttl: 100 })
			.then(function(reply)
			{
				setTimeout(checkKey, 1000);
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});
	});

	describe('keys()', function()
	{
		it('gets keys() for the given bucket', function(done)
		{
			var keys = [];
			var kstream = node.keys('bucket');
			kstream.must.have.property('on');
			kstream.on.must.be.a.function();

			kstream.on('data', function(key)
			{
				keys.push(key);
			});

			kstream.on('end', function()
			{
				keys.length.must.equal(2);
				keys[0].must.equal('2');
				keys[1].must.equal('3');
				done();
			});
		});
	});

	describe('shutdown', function()
	{
		it('closes the db', function(done)
		{
			node.shutdown()
			.then(function(reply)
			{
				// silence on success?
				done();
			})
			.fail(function(err)
			{
				demand(err).not.exist();
			})
			.done();
		});
	});

	after(function(done)
	{
		rimraf('./test/t1', function(err)
		{
			rimraf('./test/t2', function(err)
			{
				rimraf('./test/t3', done);
			});
		});
	});
});
