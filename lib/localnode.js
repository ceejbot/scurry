// The leveldb storage layer
// sublevel + levelup + leveldown-hyper
// sublevel == buckets

var
	crypto   = require('crypto'),
	fs       = require('fs'),
	levelup  = require('levelup'),
	sublevel = require('level-sublevel'),
	P        = require('p-promise'),
	path     = require('path'),
	ttl      = require('level-ttl'),
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

	var dbopts =
	{
		valueEncoding: 'json'
	};

	this.db = ttl(sublevel(levelup(dbpath), dbopts));
}

LocalNode.prototype.shutdown = function()
{
	this.db.close();
};

LocalNode.prototype.save = function(bucket, id, body, ttl)
{
	var deferred = P.defer();

	var payload = body;
	if (Buffer.isBuffer(payload))
		payload = payload.toString('base64');

	var crc = crypto.createHash('md5');
	crc.update(payload);

	var data =
	{
		ts:      Date.now(),
		payload: payload,
		etag:    crc.digest('hex')
	};
	var opts = {};
	if (ttl)
		opts.ttl = ttl;

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

