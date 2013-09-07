// A readable stream that emits monotonically-increasing random integers.

var
	stream = require('stream'),
	util   = require('util')
	;

function IntegerStream(count)
{
	this.max = count || Math.floor(Math.random() * 100);
	this.count = 0;
	stream.Readable.call(this, { objectMode: true});

	this.value = Math.floor(Math.random() * 250);
}
util.inherits(IntegerStream, stream.Readable);

IntegerStream.prototype.generate = function()
{
	if (this.count >= this.max)
	{
		this.push(null);
		this.value = null;
		return;
	}

	this.push(this.value);
	this.value = this.value + Math.floor(Math.random() * 50) + 1;
	this.count++;
}

IntegerStream.prototype._read = function(size)
{
	var r = Math.floor(Math.random() * 50);
	if (r < 10)
		this.generate();
	else
		setTimeout(this.generate.bind(this), r);
};

module.exports = IntegerStream;
