var
	P       = require('p-promise'),
	request = require('request'),
	util    = require('util')
	;

function RemoteNode(opts)
{
	this.id = opts.id;
	this.host = opts.host;
	this.port = +opts.port;

	this.endpoint = 'http://' + this.host + ':' + this.port + '/';
}

// This is probably all wrong. Should just proxy the request.
// or even just redirect at a higher layer. dunno.

RemoteNode.prototype.save = function(bucket, id, body)
{
	var deferred = P.defer();
	var opts =
	{
		uri: this.endpoint + '/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(id),
		body: body
	};

	request.post(opts, function(err, response, body)
	{
		if (err)
			deferred.reject(err);
		else
			deferred.resolve('OK');
	});

	return deferred.promise;
};

RemoteNode.prototype.get = function(bucket, id)
{
	var deferred = P.defer();

	var uri = this.endpoint + '/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(id);
	request.get(uri, function(err, response, body)
	{
		if (err)
			deferred.reject(err);
		else
			deferred.resolve(body);
	});

	return deferred.promise;
};

RemoteNode.prototype.del = function(bucket, id)
{
	var deferred = P.defer();
	var uri = this.endpoint + '/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(id);

	request.del(uri, function(err, response, body)
	{
		if (err)
			deferred.reject(err);
		else
			deferred.resolve(body);
	});

	return deferred.promise;
};

RemoteNode.prototype.debug = function()
{
	return this.id + ' @ ' + this.host + ':' + this.port;
};

module.exports = RemoteNode;
