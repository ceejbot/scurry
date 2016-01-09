// The leveldb storage layer
// sublevel + levelup + leveldown-hyper
// sublevel == buckets

var
	assert   = require('assert'),
	crypto   = require('crypto'),
	fs       = require('fs'),
	levelup  = require('levelup'),
	sublevel = require('level-sublevel'),
	P        = require('p-promise'),
	path     = require('path'),
	ttl      = require('level-ttl'),
	util     = require('util')
	;

var VERSION = 1;

function LocalNode(opts)
{
	assert(opts, 'you must pass an options object to LocalNode()');
	assert(opts.id, 'you must pass an ID in the options object');
	assert(opts.dbpath, 'you must pass a dbpath in the options object');

	this.id     = opts.id;
	this.logger = opts.logger;
	// etc

	var cwd = process.cwd();
	var dbpath = path.normalize(path.join(cwd, opts.dbpath));
	if (!fs.existsSync(dbpath))
		fs.mkdirSync(dbpath);

	var dbopts =
	{
		valueEncoding: 'json'
	};

	var db = levelup(dbpath, dbopts);
	db = sublevel(db);
	db = ttl(db, { checkFrequency: (opts.checkFrequency || 10000 )}); // 10 seconds by default
	this.db = db;
}

LocalNode.prototype.shutdown = function()
{
	var deferred = P.defer();
	this.db.close(function(err)
	{
		if (err) deferred.reject(err);
		else deferred.resolve('OK');
	});
	return deferred.promise;
};

LocalNode.prototype.set = function(bucket, id, body, metadata)
{
	assert(bucket && (typeof bucket === 'string'), 'you must provide a string bucket');
	assert(id && (typeof id === 'string'), 'you must provide a string id');

	var deferred = P.defer();
	metadata = metadata || {};
	var crc = crypto.createHash('md5');

	var payload = body;
	if (Buffer.isBuffer(body))
	{
		payload = body.toString('base64');
		crc.update(body);
	}
	else
		crc.update(JSON.stringify(body));

	var data =
	{
		version:        VERSION,
		ts:             Date.now(),
		payload:        payload,
		etag:           crc.digest('hex'),
		base64:         Buffer.isBuffer(body),
		'content-type': metadata['content-type']
	};
	var opts = {};
	if (metadata.ttl)
		opts.ttl = metadata.ttl;

	var sublevel = this.db.sublevel(bucket);
	sublevel.put(id, data, opts, function(err)
	{
		if (err) deferred.reject(err);
		else
			deferred.resolve('OK');
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
			return deferred.resolve(null);
		else if (err)
			return deferred.reject(err);

		if (value.base64)
		{
			value.payload = new Buffer(value.payload, 'base64');
			delete value.base64;
		}

		// here examine version number & migrate object if necessary

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

LocalNode.prototype.keys = function(bucket)
{
	var sublevel = this.db.sublevel(bucket);
	var keystream = sublevel.createKeyStream();
	return keystream;
};

module.exports = LocalNode;
