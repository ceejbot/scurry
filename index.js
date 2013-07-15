// Pull all the pieces in lib together to construct a server

var
	assert   = require('assert'),
	Mesh     = require('./lib/mesh'),
	localip  = require("my-local-ip")(),
	optimist = require('optimist')
		.usage('Run a single node in the mesh.\nIf you pass a config file, none of the other options are considered.\nUsage: $0 --id=node-one -p 3000 -g 4114 --dbpath=./db\n       $0 --config=./node-one.json')
		.alias('c', 'config')
		.describe('c', 'path to a json file defining the other config options')
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
	;

optimist.check(function(args)
{
	return (args.c || (!!args.id && !!args.g && !!args.d))
});

var opts;

if (optimist.argv.config)
	opts = require(optimist.argv.config);
else
{
	opts =
	{
		id:      optimist.argv.id,
		dbpath:  optimist.argv.dbpath,
		api:     optimist.argv.port,
		gossip:  optimist.argv.gossip,
		server:  optimist.argv.server,
		localip: localip,
		master:  optimist.argv.master
	};
}

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
