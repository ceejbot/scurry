// The leveldb storage layer
// sublevel + levelup + leveldown-hyper
// sublevel == buckets

var
	levelup  = require('levelup'),
	sublevel = require('level-sublevel'),
	P        = require('p-promise'),
	Node     = require('./remotenode').Node,
	util     = require('util')
	;

function LocalNode(opts)
{
	Node.call(this);

	this.db = sublevel(levelup(opts.dbpath));
	this.cycle = new Lightcycle(opts);
	// etc
}
util.inherits(LocalNode, Node);

exports.createStorage = function createStorage(opts)
{
	return new LocalNode(opts);
};

exports.LocalNode = LocalNode;

LocalNode.prototype.save = function(bucket, id, body)
{
	// TODO
	// call mesh.locate() on bucket, id pair
	// if request is local, do a put on our storage
	// if request is not local, proxy it to the resource it lives on

	var deferred = P.defer();

	var sublevel = this.db.sublevel(bucket);
	sublevel.put(id, body, function(err)
	{
		if (err) deferred.reject(err);
		else deferred.resolve('OK');
	});

	return deferred.promise;
};

LocalNode.prototype.get = function(bucket, id)
{
	// TODO - same pattern as for save()

	var deferred = P.defer();

	var sublevel = this.db.sublevel(bucket);
	sublevel.get(id, function(err, value)
	{
		if (err) deferred.reject(err);
		else deferred.resolve(value);
	});

	return deferred.promise;
};

LocalNode.prototype.del = function(bucket, id)
{
	// TODO - same pattern as for save()

	var deferred = P.defer();

	var sublevel = this.db.sublevel(bucket);
	sublevel.del(id, function(err)
	{
		if (err) deferred.reject(err);
		else deferred.resolve('OK');
	});

	return deferred.promise;
};

LocalNode.prototype.keyStreamFor = function(bucket)
{
	// This is going to require some thought to make work, because
	// the keys will be scattered across many shards.
	// The interesting property of leveldb is that the keys are
	// sorted; is that preservable?

	// ANSWER: Yes. This node will initiate calls to all remote nodes asking for
	// keys, then mux them all together. Sorting will require buffering at least
	// partially. Some juggling required.

	var sublevel = this.db.sublevel(bucket);
	var keystream = sublevel.createKeyStream();
	return keystream;
};
