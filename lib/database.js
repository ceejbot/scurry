// The leveldb storage layer
// sublevel + levelup + leveldown-hyper
// sublevel == buckets

var
	levelup = require('levelup'),
	sublevel = require('level-sublevel')
	;

exports.createDatabase = function createDatabase(opts)
{
	var db = sublevel(levelup(opts.dbpath));

	return db;
};
