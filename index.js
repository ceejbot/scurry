// Pull all the pieces in lib together to construct a server

var
	Mesh      = require('./lib/mesh'),
	localip   = require("my-local-ip")(),
	optimist  = require('optimist')
		.usage('Run a single node in the mesh.\nUsage: $0 --id=node-one -p 3000 -g 4114 --dbpath=./db')
		.string('id')
		.describe('id', 'ID of this node; must be unique in the mesh')
		.alias('d', 'dbpath')
		.describe('d', 'path to store leveldb files')
		.alias('p', 'port')
		.describe('p', 'port for this node\'s REST API')
		.alias('g', 'gossip')
		.describe('g', 'port for the mesh gossip traffic')
		.boolean('m')
		.alias('m', 'master')
		.describe('m', 'be a gossip server')
		.alias('s', 'server')
		.describe('s', 'hostname of the gossip server to connect to')
		.demand(['d', 'g', 'p'])
	;

var opts =
{
	id:      optimist.argv.id,
	dbpath:  optimist.argv.dbpath,
	api:     optimist.argv.port,
	gossip:  optimist.argv.gossip,
	server:  optimist.argv.server,
	localip: localip,
	master:  optimist.argv.master
};

var mesh = new Mesh(opts);


process.on('SIGINT', mesh.disconnect.bind(mesh));

mesh.connect()
.then(function()
{
	mesh.join();
})
.fail(function(err)
{
	console.log(err);
	process.exit(1);
})
.done();
