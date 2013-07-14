function RemoteNode(opts)
{
	this.isremote = true;
	this.id       = opts.id;
	this.host     = opts.host;
	this.port     = +opts.port;
	this.endpoint = 'http://' + this.host + ':' + this.port;
}

module.exports = RemoteNode;
