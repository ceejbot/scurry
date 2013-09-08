// A readable stream that emits monotonically-increasing random integers.

var
	stream = require('stream'),
	util   = require('util')
	;

function IntegerStream(max)
{
	this.max = (max === undefined) ? Math.floor(Math.random() * 100) : max;
	this.count = 0;
	stream.Readable.call(this, { objectMode: true});
	this.timer = null;

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
	this.timer = null;
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
	if (this.timer) return;

	var r = Math.floor(Math.random() * 50);
	if (true || r < 10)
		this.generate();
	else
		this.timer = setTimeout(this.generate.bind(this), r);
};

module.exports = IntegerStream;
