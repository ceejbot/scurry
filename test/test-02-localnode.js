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
	var opts = { id: 'test-id', dbpath: './test/t3' };
	var node = new LocalNode(opts);

	return node;
}

describe('LocalNode', function()
{
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
		var node = nodeFixture();

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

		it('has tests that verify what it stores in the db');
	});

	describe('get()', function()
	{
		it('has tests for get()');
	});

	describe('del()', function()
	{
		it('removes an item from storage');
		it('is silent when removing an item that does not exist');
	});

	describe('TTLs', function()
	{
		it('has TTL tests');
	});

	after(function()
	{
		child.exec('rm -rf ./test/t1');
		child.exec('rm -rf ./test/t2');
		child.exec('rm -rf ./test/t3');
	});
});
