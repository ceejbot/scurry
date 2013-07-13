// Pull all the pieces in lib together to construct a server

var
	storage   = require('./lib/localnode'),
	remote    = require('./lib/remotenode'),
	endpoints = require('./lib/endpoints'),
	mesh      = require('./lib/mesh')
	;

// optimist

// create mesh; get settings from mesh
// create restify server with endpoints & start it listening
// join mesh
// update lightcycle
