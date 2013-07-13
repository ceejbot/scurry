// Servers communicate with other servers on a scuttlebutt network.
// Things they communicate:
// -- other nodes they know about
// -- join/leave messages or whatever ends up mattering
// -- the seed for the consistent hash
// From this they all build a lightcycle hash they use to decide where
// a specific piece of data lives. When any node gets a request, they route
// to the node where the data really lives.

// no replication yet.

// ids of objects as seen by the has are <bucket>/<id>

var
	Lightcycle = require('light-cycle')
	;



function Mesh(opts)
{
	this.cycle = new Lightcycle(opts);
}

Mesh.prototype.locate = function(bucket, id)
{

};
