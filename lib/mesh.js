// Servers communicate with other servers on a scuttlebutt network.
// Things they communicate:
// -- other nodes they know about
// -- join/leave messages or whatever ends up mattering
// -- the seed for the consistent hash
// From this they all build a lightcycle hash they use to decide where
// a specific piece of data lives. When any node gets a request, they route
// to the node where the data really lives.

// no replication yet.

// ids of objects as seen by the hash are <bucket>/<id>

var
	Lightcycle = require('light-cycle'),
	P          = require('p-promise')
	;



function Mesh(opts)
{
	// opts must include enough info to get to the scuttlebutt
	// if first server in scuttlebutt, build cycle from local options
	// build storage from local options
	// broadcast cycle hash options to joiners
	// add joiners to cycle
}

Mesh.prototype.createCycle = function(opts)
{
	this.cycle = new Lightcycle(opts);

	// add our local storage as a LocalNode()
	// add remote nodes as we are informed about them
};

Mesh.prototype.locate = function(bucket, id)
{
	// if no cycle yet, not ready to handle requests
	// should not start the endpoints server listening until that's done
	// maybe a state machine? might not need to be so formal

	var node = this.cycle.locate(bucket + '/' + id);
};

Mesh.prototype.join = function()
{

};

Mesh.prototype.leave = function()
{

};

