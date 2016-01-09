/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	RemoteNode = require('../lib/remotenode');

describe('RemoteNode', function()
{
	it('constructor throws if no options passed', function()
	{
		function mustThrow()
		{
			var node = new RemoteNode();
		}

		mustThrow.must.throw(Error);
	});

	it('constructor throws if no ID passed', function()
	{
		function mustThrow()
		{
			var node = new RemoteNode({ foo: 'bar' });
		}

		mustThrow.must.throw(Error);
	});

	it('constructor throws if no host passed', function()
	{
		function mustThrow()
		{
			var node = new RemoteNode({ id: 'bar' });
		}

		mustThrow.must.throw(Error);
	});

	it('constructor throws if no port passed', function()
	{
		function mustThrow()
		{
			var node = new RemoteNode({ id: 'bar', host: 'localhost' });
		}

		mustThrow.must.throw(Error);
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

		node.id.must.equal(opts.id);
		node.host.must.equal(opts.host);
		node.port.must.equal(opts.port);
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

		node.endpoint.must.exist();
		node.endpoint.must.be.a.string();
	});
});
