/*global describe:true, it:true, before:true, after:true */

var
	chai   = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	child  = require('child_process'),
	fs     = require('fs')
	;

var LocalNode = require('../lib/localnode');

function nodeFixture()
{
	var opts = { id: 'test-id', dbpath: './test/t3', checkFrequency: 1000 };
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
			shouldThrow.should.throw(Error);
		});

		it('throws if no ID passed', function()
		{
			function shouldThrow()
			{
				var node = new LocalNode({ foo: 'bar' });
			}
			shouldThrow.should.throw(Error);
		});

		it('throws if no dbpath passed', function()
		{
			function shouldThrow()
			{
				var node = new LocalNode({ id: 'bar' });
			}
			shouldThrow.should.throw(Error);
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
			assert.equal(node.id, opts.id);
			assert.equal(node.logger, opts.logger);
			assert.ok(node.db);
			node.db.close(done);
		});

		it('creates the dbpath if needed', function(done)
		{
			assert.ok(!fs.existsSync('./test/t2'), 'test db path exists already!');
			var opts = { id: 'test-id', dbpath: './test/t2' };
			var node = new LocalNode(opts);

			node.db.on('ready', function()
			{
				assert.ok(fs.existsSync('./test/t2'), 'test db path was not created');
				node.db.close(done);
			});
		});

		it('wraps the db with level-sublevel', function(done)
		{
			var opts = { id: 'test-id', dbpath: './test/t1' };
			var node = new LocalNode(opts);
			var db = node.db;

			assert.ok(db.sublevel, 'db has not been sublevel-ified');
			assert.ok(typeof db.sublevel === 'function', 'db has not been sublevel-ified');
			db.close(done);
		});

		it('wraps the db with level-ttl', function(done)
		{
			var opts = { id: 'test-id', dbpath: './test/t1' };
			var node = new LocalNode(opts);
			var db = node.db;

			assert.ok(db.ttl, 'db has not been wrapped with ttl()');
			assert.ok(typeof db.ttl === 'function', 'db has not been wrapped with ttl()');
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
			shouldThrow.should.throw(Error);
		});

		it('requires that you pass a string id', function()
		{
			function shouldThrow()
			{
				node.set('bucket');
			}
			shouldThrow.should.throw(Error);
		});

		it('returns a promise', function(done)
		{
			var result = node.set('bucket', '1', 'I am a value.');
			assert.ok(result.then);
			assert.equal(typeof result.then, 'function', 'not a promise');

			result.then(function(reply)
			{
				assert.equal(reply, 'OK');
				done();
			})
			.fail(function(err)
			{
				should.not.exist(err);
			}).done();
		});

		it('stores an object with crc & modification timestamp', function(done)
		{
			node.get('bucket', '1')
			.then(function(result)
			{
				assert.ok(result, 'did not find a value!');
				assert.equal(typeof result, 'object', 'did not store an object');
				assert.ok(result.ts, 'no timestamp');
				assert.equal(typeof result.ts, 'number');
				assert.ok(result.etag, 'no etag hash');
				assert.ok(result.payload, 'no payload holding the value');
				done();
			})
			.fail(function(err)
			{
				should.not.exist(err);
			})
			.done();
		});

		it('stores strings successfully', function(done)
		{
			node.get('bucket', '1')
			.then(function(result)
			{
				assert.ok(result.payload, 'no payload holding the value');
				assert.equal(typeof result.payload, 'string');
				assert.equal(result.payload, 'I am a value.');

				done();
			})
			.fail(function(err)
			{
				should.not.exist(err);
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
				assert.ok(result.payload, 'no payload holding the value');
				assert.ok(Buffer.isBuffer(result.payload));
				assert.equal(result.payload.length, 8);
				assert.equal(result.payload[0], 1);
				done();
			})
			.fail(function(err)
			{
				should.not.exist(err);
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
				assert.ok(stored, 'no payload holding the value');
				assert.equal(typeof stored, 'object', 'did not get an object back');
				assert.ok(stored.foo);
				assert.equal(stored.foo, 'foo');
				assert.ok(stored.bar);
				assert.equal(stored.bar, 'bar');
				assert.ok(stored.baz);
				assert.ok(Array.isArray(stored.baz), 'array subitem not stored correctly');
				done();
			})
			.fail(function(err)
			{
				should.not.exist(err);
			})
			.done();
		});

		it('stores binary data successfully', function(done)
		{
			fs.readFile('./test/mocks/data.png', function(err, data)
			{
				should.not.exist(err);
				node.set('bucket', '4', data, { 'content-type': 'image/png' })
				.then(function()
				{
					return node.get('bucket', '4');
				})
				.then(function(result)
				{
					var stored = result.payload;
					assert.ok(stored, 'no payload holding the value');
					assert.ok(Buffer.isBuffer(stored), 'did not get a buffer back');
					assert.equal(result['content-type'], 'image/png', 'content type was not stored');
					done();
				})
				.fail(function(err)
				{
					should.not.exist(err);
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
			assert.ok(result.then);
			assert.equal(typeof result.then, 'function', 'not a promise');
		});

		it('can fetch a previously-stored value', function(done)
		{
			node.get('bucket', '1')
			.then(function(result)
			{
				assert.ok(result, 'did not find a value!');
				done();
			})
			.fail(function(err)
			{
				should.not.exist(err);
			})
			.done();
		});

		it('returns an empty value for non-existent keys', function(done)
		{
			node.get('bucket', '12')
			.then(function(result)
			{
				assert.equal(result, null, 'expected null for non-existent keys!');
				done();
			})
			.fail(function(err)
			{
				should.not.exist(err);
			})
			.done();
		});
	});

	describe('del()', function()
	{
		it('returns a promise', function()
		{
			var result = node.del('bucket', '1');
			assert.ok(result.then);
			assert.equal(typeof result.then, 'function', 'not a promise');
		});

		it('removes an item from storage', function(done)
		{
			node.get('bucket', '1')
			.then(function(result)
			{
				assert.equal(result, null, 'expected null for a deleted key');
				done();
			})
			.fail(function(err)
			{
				should.not.exist(err);
			})
			.done();
		});

		it('is silent when removing an item that does not exist', function(done)
		{
			node.del('bucket', '1')
			.then(function(reply)
			{
				assert.ok(reply);
				assert.equal(reply, 'OK');
				done();
			})
			.fail(function(err)
			{
				should.not.exist(err);
			})
			.done();
		});
	});

	describe('TTLs', function()
	{
		it('can set a TTL on a key', function(done)
		{
			function checkKey()
			{
				node.get('bucket', '4')
				.then(function(value)
				{
					should.not.exist(value);
					done();
				}).done();
			}

			node.set('bucket', '4', 'dead value walking', { ttl: 1 })
			.then(function(reply)
			{
				setTimeout(checkKey, 1500);
			})
			.fail(function(err)
			{
				should.not.exist(err);
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
			assert.ok(kstream.on);
			assert.equal(typeof kstream.on, 'function');

			kstream.on('data', function(key)
			{
				keys.push(key);
			});

			kstream.on('end', function()
			{
				assert.equal(keys.length, 2);
				assert.equal(keys[0], '2');
				assert.equal(keys[1], '3');
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
				should.not.exist(err);
			})
			.done();
		});
	});

	after(function()
	{
		child.exec('rm -rf ./test/t1');
		child.exec('rm -rf ./test/t2');
		child.exec('rm -rf ./test/t3');
	});
});
