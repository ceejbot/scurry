var
	crypto     = require('crypto'),
	Lightcycle = require('light-cycle'),
	P          = require('p-promise')
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
	return P(Object.keys(this.store[bucket]));
};
