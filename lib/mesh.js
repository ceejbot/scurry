// Servers communicate with other servers on a scuttlebutt network.
// Things they communicate:
// -- other nodes they know about
// -- join/leave messages or whatever ends up mattering
// -- the seed for the consistent hash
// From this they all build a lightcycle hash they use to decide where
// a specific piece of data lives. When any node gets a request, they route
// to the node where the data really lives.

// no replication yet.

// ids of objects as seen by the hash are <bucket>/<id>

var
	assert     = require('assert'),
	crdt       = require('crdt'),
	endpoints  = require('endpoints'),
	Lightcycle = require('light-cycle'),
	net        = require('net'),
	P          = require('p-promise'),
	uuid       = require('node-uuid')
	;

function Mesh(opts)
{
	this.options = opts;
	assert(opts.gossipport, 'you must pass a `gossipport` option for node communication');
	assert(opts.port, 'you must pass a `port` option for this node\'s REST server');

	this.id = opts.id || uuid.v4();
	this.restify = endpoints.createServer({ mesh: this });
	this.cycle = new Lightcycle(opts);

	this.meshdata = new crdt.Doc();
	this.server = net.createServer(this.scuttler.bind(this));

	this.nodelist =  this.meshdata.createSet('type', 'nodes');
	this.nodelist.on('add', this.handleJoiningNode.bind(this));
	this.nodelist.on('changes', this.handleChangingNode.bind(this));
	this.nodelist.on('remove', this.handleLeavingNode.bind(this));
}

Mesh.prototype.connect = function()
{
	var self = this,
		deferred = P.defer();

	this.restify.listen(this.options.port, function()
	{
		console.log('restify server bound');
		self.server.listen(self.options.gossipport, function()
		{
			console.log('scuttler bound');
			deferred.resolve('OK');
		});
	})
	.fail(function(err)
	{
		deferred.reject(err);
	}).done();

	return deferred.promise;
};

Mesh.prototype.scuttler = function(stream)
{
	stream
		.pipe(this.nodelist.createStream())
		.pipe(stream);

	stream.on('end', function()
	{
		console.log('scuttlebutter disconnected');
	});
};

Mesh.prototype.locate = function(bucket, id)
{
	var node = this.cycle.locate(bucket + '/' + id);
	return node;
};

Mesh.prototype.join = function()
{
	this.meshdata.add(
	{
		id:   this.id,
		host: this.options.host,
		port: this.options.port,
		type: 'node'
	});
	this.cycle.add(new LocalNode(
	{
		id:     this.id,
		dbpath: this.options.dbpath,
	}), this.id);
};

Mesh.prototype.leave = function()
{
	this.meshdata.rm(this.id);
	this.cycle.remove(this.id);
};

Mesh.prototype.handleJoiningNode = function(node)
{
	this.cycle.add(new RemoteNode());
};

Mesh.prototype.handleChangingNode = function(node, changed)
{
	// IMPLEMENT
};

Mesh.prototype.handleLeavingNode = function(node)
{
	this.cycle.remove(node.id);
};


