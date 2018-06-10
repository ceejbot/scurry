// The gossip network aka the mesh.
// We aren't peer-to-peer yet; we need a single server.

// no replication yet.

'use strict';

const
	assert     = require('assert'),
	bole       = require('bole'),
	crdt       = require('crdt'),
	Lightcycle = require('light-cycle'),
	net        = require('net'),
	P          = require('p-promise'),
	uuid       = require('uuid')
	;

const
	endpoints  = require('./endpoints'),
	LocalNode  = require('./localnode'),
	RemoteNode = require('./remotenode')
	;

function Mesh(opts)
{
	this.options = opts;
	assert(opts.gossip, 'you must pass a `gossip` port option for node communication');
	assert(opts.api, 'you must pass a `api` option for this node\'s REST server port');

	this.id = opts.id || uuid.v4();
	this.mynode = null;

	this.logger = bole(this.id);

	this.restify = endpoints.createServer({ mesh: this, log: this.logger });
	this.cycle = new Lightcycle({ seed: opts.seed || 0xcafed00d, size: opts.size || 10 });

	this.meshdata = new crdt.Doc();

	this.nodelist = this.meshdata.createSet('type', 'node');
	this.nodelist.addListener('add', this.handleJoiningNode.bind(this));
	this.nodelist.addListener('changes', this.handleChangingNode.bind(this));
	this.nodelist.addListener('remove', this.handleLeavingNode.bind(this));
}

Mesh.prototype.connect = function()
{
	var deferred = P.defer();

	this.logger.info('starting servers...');

	this.start().then(() =>
	{
		this.restify.listen(this.options.api, this.options.localip, () =>
		{
			this.logger.info('restify server bound to ' + this.options.localip + ':' + this.options.api);
			deferred.resolve('OK');
		});
	}).done();

	return deferred.promise;
};

Mesh.prototype.start = function()
{
	var deferred = P.defer();

	if (this.options.master)
	{
		this.server = net.createServer(this.scurry.bind(this));
		this.server.listen(this.options.gossip, this.options.localip, () =>
		{
			this.logger.info('scurry listening at ' + this.options.localip + ':' + this.options.gossip);
			deferred.resolve('OK');
		});

		return deferred.promise;
	}

	this.logger.info('scurry looking for network at ' + this.options.server + ':' + this.options.gossip);
	this.connection = net.connect(this.options.gossip, this.options.server);
	this.connection.pipe(this.meshdata.createStream()).pipe(this.connection);
	return P('OK');
};

Mesh.prototype.disconnect = function()
{
	this.logger.info('disconnecting');
	this.leave();
	// this is going to happen too fast sometimes; should be on next tick?
	if (this.server)
		this.server.close();
	if (this.connection)
		this.connection.end();
	this.restify.close();
	if (this.mynode)
		this.mynode.shutdown();

	// TODO should wait & resolve when servers all done
};

Mesh.prototype.scurry = function(stream)
{
	stream.pipe(this.meshdata.createStream()).pipe(stream);
	stream.on('end', () =>
	{
		// self.logger.info('scuttlebutt client disconnected');
	});
};

Mesh.prototype.locate = function(bucket, id)
{
	assert(bucket, 'you must provide a string in the bucket argument');
	assert(id && typeof id === 'string', 'you must provide a string in the id argument');
	var node = this.cycle.locate(bucket + '/' + id);
	return node;
};

Mesh.prototype.join = function()
{
	this.logger.info('joining self to mesh');
	this.meshdata.add({
		id:   this.id,
		host: this.options.localip,
		port: this.options.api,
		type: 'node'
	});

	this.mynode = new LocalNode({
		id:     this.id,
		dbpath: this.options.dbpath,
	});

	this.cycle.add(this.mynode, this.id);
};

Mesh.prototype.leave = function()
{
	this.meshdata.rm(this.id);
	this.cycle.remove(this.id);
};

Mesh.prototype.handleJoiningNode = function(node)
{
	if (node.id === this.id)
		return;
	this.logger.info('node joining', node.state);
	var remote = new RemoteNode(node.state);
	this.cycle.add(remote, remote.id);
};

Mesh.prototype.handleChangingNode = function(node, changed)
{
	// IMPLEMENT
	// this.logger.info('node changing', node.state);
};

Mesh.prototype.handleLeavingNode = function(node)
{
	if (node.id === this.id)
		return;
	this.logger.info('node leaving', node.state);
	this.cycle.remove(node.id);
};

Mesh.prototype.nodes = function()
{
	return this.cycle.entries;
};

module.exports = Mesh;
