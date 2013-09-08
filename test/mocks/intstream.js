// A readable stream that emits monotonically-increasing random integers.

var
	stream = require('stream'),
	util   = require('util')
	;

function IntegerStream(count)
{
	this.max = (count === undefined) ? Math.floor(Math.random() * 100) : count;
	this.count = 0;
	stream.Readable.call(this, { objectMode: true});

	this.value = Math.floor(Math.random() * 250);
}
util.inherits(IntegerStream, stream.Readable);

IntegerStream.prototype.checkDone = function()
{
	if (this.count >= this.max)
	{
		this.push(null);
		this.value = null;
		return true;
	}

	return false;
};

IntegerStream.prototype.generate = function()
{
	if (!this.checkDone())
	{
		this.push(this.value);
		this.count++;
		if (!this.checkDone())
			this.value = this.value + Math.floor(Math.random() * 50) + 1;
	}
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
