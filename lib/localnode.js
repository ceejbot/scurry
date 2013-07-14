// The leveldb storage layer
// sublevel + levelup + leveldown-hyper
// sublevel == buckets

var
	fs       = require('fs'),
	levelup  = require('levelup'),
	sublevel = require('level-sublevel'),
	P        = require('p-promise'),
	path     = require('path'),
	util     = require('util')
	;

function LocalNode(opts)
{
	this.id     = opts.id;
	this.logger = opts.logger;
	// etc

	var cwd = process.cwd();
	var dbpath = path.normalize(path.join(cwd, opts.dbpath));
	if (!fs.existsSync(dbpath))
		fs.mkdirSync(dbpath);

	this.db = sublevel(levelup(dbpath));
}

LocalNode.prototype.save = function(bucket, id, body)
{
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
	var deferred = P.defer();

	var sublevel = this.db.sublevel(bucket);
	sublevel.get(id, function(err, value)
	{
		if (err && err.name === 'NotFoundError')
			deferred.resolve(null);
		else if (err)
			deferred.reject(err);
		else
			deferred.resolve(value);
	});

	return deferred.promise;
};

LocalNode.prototype.del = function(bucket, id)
{
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
	var sublevel = this.db.sublevel(bucket);
	var keystream = sublevel.createKeyStream();
	return keystream;
};

module.exports = LocalNode;

