/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	rimraf = require('rimraf'),
	fs     = require('fs')
	;

var LocalNode = require('../lib/localnode');

function nodeFixture()
{
	var opts = { id: 'test-id', dbpath: './test/t3', checkFrequency: 1000 };
	var node = new LocalNode(opts);

	return node;
}

describe('LocalNode', () =>
{
	var node = nodeFixture();

	describe('constructor', () =>
	{
		it('throws if no options passed', () =>
		{
			function shouldThrow()
			{
				new LocalNode();
			}
			shouldThrow.must.throw(/options/);
		});

		it('throws if no ID passed', () =>
		{
			function shouldThrow()
			{
				new LocalNode({ foo: 'bar' });
			}
			shouldThrow.must.throw(/ID/);
		});

		it('throws if no dbpath passed', () =>
		{
			function shouldThrow()
			{
				new LocalNode({ id: 'bar' });
			}
			shouldThrow.must.throw(/dbpath/);
		});

		it('can construct a node when passed the required options', done =>
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

		it('creates the dbpath if needed', done =>
		{
			fs.existsSync('./test/t2').must.be.false();
			var opts = { id: 'test-id', dbpath: './test/t2' };
			var node = new LocalNode(opts);

			fs.existsSync('./test/t2').must.be.true();
			node.db.close(done);
		});

		it('wraps the db with level-sublevel', done =>
		{
			var opts = { id: 'test-id', dbpath: './test/t1' };
			var node = new LocalNode(opts);
			var db = node.db;

			db.sublevel, 'db has not been sublevel-ified'.must.exist();
			db.sublevel.must.be.a.function();
			db.close(done);
		});

		it('wraps the db with level-ttl', done =>
		{
			var opts = { id: 'test-id', dbpath: './test/t1' };
			var node = new LocalNode(opts);
			var db = node.db;

			db.must.have.property('ttl');
			db.ttl.must.be.a.function();
			db.close(done);
		});
	});

	describe('set()', () =>
	{
		it('requires that you pass a string bucket', () =>
		{
			function shouldThrow()
			{
				node.set();
			}
			shouldThrow.must.throw(Error);
		});

		it('requires that you pass a string id', () =>
		{
			function shouldThrow()
			{
				node.set('bucket');
			}
			shouldThrow.must.throw(Error);
		});

		it('returns a promise', done =>
		{
			var result = node.set('bucket', '1', 'I am a value.');
			result.must.have.property('then');
			result.then.must.be.a.function();

			result.then(reply =>
			{
				reply.must.equal('OK');
				done();
			})
				.fail(err =>
				{
					demand(err).not.exist();
				}).done();
		});

		it('stores an object with crc & modification timestamp', done =>
		{
			node.get('bucket', '1')
				.then(result =>
				{
					result.must.exist();
					result.must.be.an.object();
					result.must.have.property('ts');
					result.ts.must.be.a.number();
					result.must.have.property('etag');
					result.must.have.property('payload');
					done();
				})
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});

		it('stores strings successfully', done =>
		{
			node.get('bucket', '1')
				.then(result =>
				{
					result.must.be.an.object();
					result.must.have.property('payload');
					result.payload.must.be.a.string();
					result.payload.must.be.a.string();
					result.payload.must.equal('I am a value.');

					done();
				})
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});

		it('stores buffers successfully', done =>
		{
			var buf = Buffer.alloc(8);
			buf.fill(1);

			node.set('bucket', '2', buf)
				.then(() =>
				{
					return node.get('bucket', '2');
				})
				.then(result =>
				{
					result.payload, 'no payload holding the value'.must.exist();
					Buffer.isBuffer(result.payload).must.be.true();
					result.payload.length.must.equal(8);
					result.payload[0].must.equal(1);
					done();
				})
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});

		it('stores objects successfully', done =>
		{
			var value =
			{
				foo: 'foo',
				bar: 'bar',
				baz: ['hunt', 'the', 'wumpus']
			};

			node.set('bucket', '3', value)
				.then(() =>
				{
					return node.get('bucket', '3');
				})
				.then(result =>
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
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});

		it('stores binary data successfully', done =>
		{
			fs.readFile('./test/mocks/data.png', (err, data) =>
			{
				demand(err).not.exist();
				node.set('bucket', '4', data, { 'content-type': 'image/png' })
					.then(() =>
					{
						return node.get('bucket', '4');
					})
					.then(result =>
					{
						result.must.have.property('payload');
						Buffer.isBuffer(result.payload).must.be.true();
						result['content-type'].must.equal('image/png', 'content type was not stored');
						done();
					})
					.fail(err =>
					{
						demand(err).not.exist();
					})
					.done();
			});
		});

	});

	describe('get()', () =>
	{
		it('returns a promise', () =>
		{
			var result = node.get('bucket', '1');
			result.must.have.property('then');
			result.then.must.be.a.function();
		});

		it('can fetch a previously-stored value', done =>
		{
			node.get('bucket', '1')
				.then(result =>
				{
					result.must.exist();
					done();
				})
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});

		it('returns an empty value for non-existent keys', done =>
		{
			node.get('bucket', '12')
				.then(result =>
				{
					demand(result).be.null();
					done();
				})
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});
	});

	describe('del()', () =>
	{
		it('returns a promise', () =>
		{
			var result = node.del('bucket', '1');
			result.must.have.property('then');
			result.then.must.be.a.function();
		});

		it('removes an item from storage', done =>
		{
			node.get('bucket', '1')
				.then(result =>
				{
					demand(result).be.null();
					done();
				})
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});

		it('is silent when removing an item that does not exist', done =>
		{
			node.del('bucket', '1')
				.then(reply =>
				{
					reply.must.exist();
					reply.must.equal('OK');
					done();
				})
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});
	});

	describe('TTLs', () =>
	{
		it('can set a TTL on a key', function(done)
		{
			this.timeout(4000);
			function checkKey()
			{
				node.get('bucket', '4')
					.then(value =>
					{
						demand(value).be.null();
						done();
					}).done();
			}

			node.set('bucket', '4', 'dead value walking', { ttl: 500 })
				.then(reply =>
				{
					setTimeout(checkKey, 2000);
				})
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});
	});

	describe('keys()', () =>
	{
		it('gets keys() for the given bucket', done =>
		{
			var keys = [];
			var kstream = node.keys('bucket');
			kstream.must.have.property('on');
			kstream.on.must.be.a.function();

			kstream.on('data', key =>
			{
				keys.push(key);
			});

			kstream.on('end', () =>
			{
				keys.length.must.equal(2);
				keys[0].must.equal('2');
				keys[1].must.equal('3');
				done();
			});
		});
	});

	describe('shutdown', () =>
	{
		it('closes the db', done =>
		{
			node.shutdown()
				.then(reply =>
				{
				// silence on success?
					done();
				})
				.fail(err =>
				{
					demand(err).not.exist();
				})
				.done();
		});
	});

	after(done =>
	{
		rimraf('./test/t1', err =>
		{
			rimraf('./test/t2', err =>
			{
				rimraf('./test/t3', done);
			});
		});
	});
});
