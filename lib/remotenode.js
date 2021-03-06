var assert = require('assert');

function RemoteNode(opts)
{
	assert(opts && typeof opts === 'object', 'must pass an options has to RemoteNode()');
	assert(opts.id, 'must pass an ID to RemoteNode()');
	assert(opts.host, 'must pass an ID to RemoteNode()');
	assert(opts.port, 'must pass an ID to RemoteNode()');

	this.isremote = true;
	this.id = opts.id;
	this.host = opts.host;
	this.port = +opts.port;
	this.endpoint = 'http://' + this.host + ':' + this.port;
}

module.exports = RemoteNode;
