// The leveldb storage layer
// sublevel + levelup + leveldown-hyper
// sublevel == buckets

var
	levelup  = require('levelup'),
	sublevel = require('level-sublevel'),
	P        = require('p-promise')
	;

function Storage(opts)
{
	this.db = sublevel(levelup(opts.dbpath));
	this.cycle = new Lightcycle(opts);
	// etc
}

exports.createStorage = function createStorage(opts)
{
	return new Storage(opts);
};

exports.Storage = Storage;

Storage.prototype.save = function(bucket, id, body)
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

Storage.prototype.get = function(bucket, id)
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

Storage.prototype.del = function(bucket, id)
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

Storage.prototype.keyStreamFor = function(bucket)
{
	// This is going to require some thought to make work, because
	// the keys will be scattered across many shards.
	// The interesting property of leveldb is that the keys are
	// sorted; is that preservable?

	var sublevel = this.db.sublevel(bucket);
	var keystream = sublevel.createKeyStream();
	return keystream;
};
