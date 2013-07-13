// Pull all the pieces in lib together to construct a server

var
	storage = require('./lib/database'),
	endpoints = require('./lib/endpoints'),
	mesh = require('./lib/mesh')
	;

// optimist

