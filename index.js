// Pull all the pieces in lib together to construct a server

var
	Mesh    = require('./lib/mesh'),
	localip = require('my-local-ip')(),
	options = require('yargs')
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

options.check(args =>
{
	return (args.c || (Boolean(args.id) && Boolean(args.g) && Boolean(args.d)));
});

var opts;

if (options.argv.config)
	opts = require(options.argv.config);
else
{
	opts =
	{
		id:      options.argv.id,
		dbpath:  options.argv.dbpath,
		api:     options.argv.port,
		gossip:  options.argv.gossip,
		server:  options.argv.server,
		master:  options.argv.master
	};
}

opts.localip = localip;

var mesh = new Mesh(opts);
process.on('SIGINT', mesh.disconnect.bind(mesh));

mesh.connect()
	.then(() =>
	{
		mesh.join();
	})
	.fail(err =>
	{
		console.log(err);
		process.exit(1);
	})
	.done();
