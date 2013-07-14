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
	Bunyan     = require('bunyan'),
	crdt       = require('crdt'),
	domain     = require('domain'),
	endpoints  = require('./endpoints'),
	Lightcycle = require('light-cycle'),
	LocalNode  = require('./localnode'),
	RemoteNode = require('./remotenode'),
	net        = require('net'),
	P          = require('p-promise'),
	uuid       = require('node-uuid')
	;

function Mesh(opts)
{
	this.options = opts;
	assert(opts.gossip, 'you must pass a `gossip` port option for node communication');
	assert(opts.api, 'you must pass a `api` option for this node\'s REST server port');

	this.id = opts.id || uuid.v4();
	this.mynode = null;

	this.logger = new Bunyan(
	{
		name: this.id,
		streams: [ { stream: process.stdout, level: 'debug' }, ]
	});

	this.restify = endpoints.createServer({ mesh: this, log: this.logger });
	this.cycle = new Lightcycle({ seed: 0xcafed00d, size: 10 });

	this.meshdata = new crdt.Doc();

	this.nodelist =  this.meshdata.createSet('type', 'node');
	this.nodelist.addListener('add', this.handleJoiningNode.bind(this));
	this.nodelist.addListener('changes', this.handleChangingNode.bind(this));
	this.nodelist.addListener('remove', this.handleLeavingNode.bind(this));
}

Mesh.prototype.connect = function()
{
	var self = this,
		deferred = P.defer();

	this.logger.info('connecting...');

	var d = domain.create();
	d.on('error', function(err)
	{
		deferred.reject(err);
	});

	d.run(function()
	{
		self.startScuttling()
		.then(function()
		{
			self.logger.info('creating restify service');
			self.restify.listen(self.options.api, self.options.localip, function()
			{
				self.logger.info('restify server bound to ' + self.options.localip + ':' + self.options.api);
				deferred.resolve('OK');
			});
		}).done();
	});

	return deferred.promise;
};

Mesh.prototype.startScuttling = function()
{
	var self = this,
		deferred = P.defer();

	if (this.options.master)
	{
		this.server = net.createServer(this.scuttler.bind(this));
		this.server.listen(this.options.gossip, this.options.localip, function()
		{
			self.logger.info('scuttler listening at ' + self.options.localip + ':' + self.options.gossip);
			deferred.resolve('OK');
		});

		return deferred.promise;
	}

	this.logger.info('scuttler looking for network at ' + self.options.server + ':' + self.options.gossip);
	this.connection = net.connect(this.options.gossip, this.options.server);
	this.connection.pipe(this.meshdata.createStream()).pipe(this.connection);
	return P('OK');
};

Mesh.prototype.disconnect = function()
{
	this.logger.info('disconnecting');
	this.leave();
	if (this.server)
		this.server.close();
	if (this.connection)
		this.connection.end();
	this.restify.close();
	if (this.mynode)
		this.mynode.shutdown();

	// TODO should wait & resolve when servers all done
};

Mesh.prototype.scuttler = function(stream)
{
	var self = this;
	stream.pipe(this.meshdata.createStream()).pipe(stream);
	stream.on('end', function()
	{
		self.logger.info('scuttlebutt client disconnected');
	});
};

Mesh.prototype.locate = function(bucket, id)
{
	var node = this.cycle.locate(bucket + '/' + id);
	return node;
};

Mesh.prototype.join = function()
{
	this.logger.info('joining self to mesh');
	this.meshdata.add(
	{
		id:   this.id,
		host: this.options.localip,
		port: this.options.api,
		type: 'node'
	});

	this.mynode = new LocalNode(
	{
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

module.exports = Mesh;
