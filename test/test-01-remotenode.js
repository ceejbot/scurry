/*global describe:true, it:true, before:true, after:true */

var
	chai   = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should()
	;

var RemoteNode = require('../lib/remotenode');

describe('RemoteNode', function()
{
	it('constructor throws if no options passed', function()
	{
		function shouldThrow()
		{
			var node = new RemoteNode();
		}

		shouldThrow.should.throw(Error);
	});

	it('constructor throws if no ID passed', function()
	{
		function shouldThrow()
		{
			var node = new RemoteNode({ foo: 'bar' });
		}

		shouldThrow.should.throw(Error);
	});

	it('constructor throws if no host passed', function()
	{
		function shouldThrow()
		{
			var node = new RemoteNode({ id: 'bar' });
		}

		shouldThrow.should.throw(Error);
	});

	it('constructor throws if no port passed', function()
	{
		function shouldThrow()
		{
			var node = new RemoteNode({ id: 'bar', host: 'localhost' });
		}

		shouldThrow.should.throw(Error);
	});

	it('can be constructed', function()
	{
		var opts =
		{
			id: 'my remote',
			host: 'localhost',
			port: 3000
		};
		var node = new RemoteNode(opts);

		assert.equal(node.id, opts.id);
		assert.equal(node.host, opts.host);
		assert.equal(node.port, opts.port);
	});

	it('defines an endpoint', function()
	{
		var opts =
		{
			id: 'my remote',
			host: 'localhost',
			port: 3000
		};
		var node = new RemoteNode(opts);

		assert.ok(node.endpoint);
		assert.equal(typeof node.endpoint, 'string');
	});

});
