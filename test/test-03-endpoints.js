/*global describe:true, it:true, before:true, after:true */

var
	chai       = require('chai'),
	assert     = chai.assert,
	expect     = chai.expect,
	should     = chai.should()
	;

var endpoints = require('../lib/endpoints');

describe('REST api', function()
{
	it('createServer() creates a server');
	it('the server listens on the passed-in port');
	it('has tests for each route');
	it('has tests for bogus requests, e.g., bad form data');
	it('tests for various middleware');
	it('GET sends back an ETag header');
	it('GET sends back the same ETag header for unchanged data');
	it('GET sends a last-modified header');
	it('demands JSON data');

});
