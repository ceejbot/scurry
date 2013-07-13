var
	P       = require('p-promise'),
	request = require('request'),
	util    = require('util')
	;

// this is in the wrong file; move later
function Node(opts)
{
	this.id = opts.id;
}

function RemoteNode(opts)
{
	Node.call(this, opts);

	this.host = opts.host;
	this.port = +opts.port;

	this.endpoint = 'http://' + this.host + ':' + this.port + '/';
}
util.inherits(RemoteNode, Node);

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

	var opts =
	{
		uri: this.endpoint + '/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(id),
	};

	request.del(opts, function(err, response, body)
	{
		if (err)
			deferred.reject(err);
		else
			deferred.resolve(body);
	});

	return deferred.promise;
};


exports.Node = Node;
exports.RemoteNode = RemoteNode;
