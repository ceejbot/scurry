var
	P    = require('p-promise'),
	util = require('util')
	;

// These are what go into the lightcycle -- should expose the same API as Storage
// you add yourself as a local node to your lightcycle & everybody else as remote nodes
// then you just call get/put/del on the node without caring how it's implemented

// this is in the wrong file; move later
function Node()
{
	this.id = '';
	this.scuttlebutt = null; // or whatever scuttlebutt needs
	this.restful = 'host:port'; // pointer to its restify server
};


function RemoteNode()
{
	Node.call(this);
}
util.inherits(RemoteNode, Node);



exports.Node = Node;
exports.RemoteNode = RemoteNode;
