/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	Mesh = require('../lib/mesh'),
	LightCycle = require('light-cycle');

var testOptions = {
	id:     'testmesh',
	gossip: 4114,
	api:    3000
};

var testmesh;

describe('Mesh', function()
{
	describe('constructor', function()
	{
		it('demands an options argument', function()
		{
			function shouldThrow()
			{
				var m = new Mesh();
				m.must.exist();
			}
			shouldThrow.must.throw(Error);
		});

		it('demands a `gossip` port option', function()
		{
			function shouldThrow()
			{
				var m = new Mesh({ foo: 'bar' });
				m.must.exist();
			}
			shouldThrow.must.throw(Error);
		});

		it('demands an `api` port option', function()
		{
			function shouldThrow()
			{
				var m = new Mesh({ gossip: 4114 });
				m.must.exist();
			}
			shouldThrow.must.throw(Error);
		});

		it('constructs a mesh when all required data is provided', function()
		{
			var m = new Mesh(
			{
				id:     'testmesh',
				gossip: 4114,
				api:    3000
			});

			m.must.exist();
			m.id.must.equal('testmesh');
		});

		it('generates a unique ID if one is not provided', function()
		{
			var m = new Mesh(
			{
				gossip: 4114,
				api:    3000
			});

			m.must.have.property('id');
			m.id.must.be.a.string();
		});

		it('creates a restify server using lib/endpoints', function()
		{
			var m = new Mesh(
			{
				id:     'testmesh',
				gossip: 4114,
				api:    3000
			});

			m.must.have.property('restify');
			m.restify.must.be.an.object();
			m.restify.must.have.property('listen');
			m.restify.listen.must.be.a.function();
		});

		it('creates a lightcycle hash ring of the specified size', function()
		{
			var m = new Mesh(
			{
				id:     'testmesh',
				gossip: 4114,
				api:    3000
			});

			m.must.have.property('cycle');
			m.cycle.must.be.instanceof(LightCycle);
		});

		it('creates a CRDT document', function()
		{
			var m = new Mesh(
			{
				id:     'testmesh',
				gossip: 4114,
				api:    3000
			});

			m.must.have.property('meshdata');
			m.meshdata.must.be.an.object();
		});
	});

	describe('connect()', function()
	{
		it('if a server, it listens on the gossip port');
		it('if a client, it connects to the gossip port & host');
		it('pipes the CRDT document data stream to the gossip server');
		it('starts the API server listening');
	});

	describe('join()', function()
	{
		it('adds a local node to the hash ring');
		it('advertises this node to the scuttlebutt network using the document');
	});

	describe('locate()', function()
	{
		it('demands bucket and id arguments', function()
		{
			function shouldThrow()
			{
				testmesh.locate();
			}

			shouldThrow.must.throw(Error);
		});

		it('creates a hash ring key by joining the arguments with /');
		it('returns the matching node from the hash ring');
	});

	describe('handleJoiningNode()', function()
	{
		it('is correctly fired when a remote or local node joins the mesh');
		it('adds new remote nodes to the hash ring');
	});

	describe('handleLeavingNode()', function()
	{
		it('is correctly fired when a remote or local node leaves the mesh');
		it('removes departed remote nodes from the hash ring');

	});

	describe('handleChangingNode()', function()
	{
		it('does not do anything right now');
	});

	describe('leave()', function()
	{
		it('removes this node from the shared document');
		it('removes our local node from the hash ring');
	});

	describe('disconnect()', function()
	{
		it('calls leave()');
		it('shuts down all servers');
	});

});
