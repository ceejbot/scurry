/*global describe:true, it:true, before:true, after:true */

var
	chai       = require('chai'),
	assert     = chai.assert,
	expect     = chai.expect,
	should     = chai.should()
	;

var endpoints = require('../lib/endpoints'),
	MockMesh = require('./mocks/mesh')
	;


var mesh = new MockMesh(5);


describe('REST api', function()
{
	describe('createServer()', function()
	{
		it('createServer() returns a configured restify server');
		it('the server listens on the passed-in port');
		it('has tests for bogus requests, e.g., bad form data');
		it('tests for various middleware');
	});

	describe('GET /:bucket', function()
	{
		it('key streaming is implemented!');
	});

	describe('POST /:bucket', function()
	{
		it('demands JSON data');

	});

	describe('PUT /:bucket/:id', function()
	{
		it('demands JSON data');

	});

	describe('GET /:bucket/:id', function()
	{
		it('GET sends back an ETag header');
		it('GET sends back the same ETag header for unchanged data');
		it('GET sends a last-modified header');
	});

	describe('HEAD /:bucket/:id', function()
	{
		it('has tests');
	});

	describe('DEL /:bucket/:id', function()
	{
		it('has tests');
	});

});
