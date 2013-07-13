// Pull all the pieces in lib together to construct a server

var
	Mesh      = require('./lib/mesh')
	optimist  = require('optimist')
		.usage('Run a single node in the mesh.\nUsage: $0 --id=node-one -p 3000 -g 4114 --dbpath=./db')
		.alias('d', 'dbpath')
		.describe('d', 'path to store leveldb files')
		.alias('g', 'gossip')
		.describe('g', 'port for the gossip traffic')
		.alias('p', 'port')
		.describe('p', 'port for the RESTify service to listen on')
		.alias('i', 'id')
		.describe('i', 'ID of this node; must be unique in the mesh')
		.demand(['d', 'g', 'p'])
	;

var opts =
{
	id:         optimist.argv.id,
	dbpath:     optimist.argv.dbpath,
	gossipport: optimist.argv.gossip,
	port:       optimist.argv.port
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
