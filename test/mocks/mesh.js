var
	crypto     = require('crypto'),
	Lightcycle = require('light-cycle'),
	P          = require('p-promise'),
	stream     = require('stream'),
	util       = require('util')
	;

var MockMesh = module.exports = function MockMesh(opts)
{
	var count = opts.count || 1;
	this.cycle = new Lightcycle({ seed: 0xcafed00d, size: count });

	for (var i = 0; i < count; i++)
	{
		var node = new MockNode(String(i));
		this.cycle.add(node, node.id);
	}
};

MockMesh.prototype.locate = function(bucket, id)
{
	return this.cycle.locate(bucket + '/' + id);
};

function MockNode(id)
{
	this.id = id;
	this.store = {};
}
MockMesh.MockNode = MockNode;

MockNode.prototype.get = function(bucket, id)
{
	if (this.store[bucket])
		return P(this.store[bucket][id]);

	return P(null);
};

MockNode.prototype.set = function(bucket, id, value, ttl)
{
	if (!this.store[bucket])
		this.store[bucket] = {};

	var crc = crypto.createHash('md5');
	var item =
	{
		payload: value,
		ts:      Date.now(),
		etag:    crc.update(JSON.stringify(value)).digest('hex')
	};
	this.store[bucket][id] = item;

	return P('OK');
};

MockNode.prototype.del = function(bucket, id)
{
	if (this.store[bucket])
		delete this.store[bucket][id];

	return P('OK');
};

MockNode.prototype.keys = function(bucket)
{
	var keys = [];
	if (this.store[bucket])
		keys = Object.keys(this.store[bucket]);

	// make a stream & respond with them
	var out = new Keystream(keys);
	return out;
};

function Keystream(keys)
{
 	stream.Readable.call(this, { objectMode : true });
 	this.keys = keys;
}
util.inherits(Keystream, stream.Readable);

Keystream.prototype._read = function(size)
{
	if (!this.keys.length)
		return this.push(null);
	this.push(JSON.stringify(this.keys.shift()));
};
