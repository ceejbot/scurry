var
	assert = require('assert'),
	events = require('events'),
	stream = require('stream'),
	util   = require('util')
	;


function MuxedStream(options)
{
	options = options || {};
	options.objectMode = true;
	stream.Readable.call(this, options);

	this.reading = true;
	this.values = [];
}
util.inherits(MuxedStream, stream.Readable);

MuxedStream.prototype._read = function(size)
{
	if (this.values.length)
		this.reading = this.push(this.values.shift());
};

MuxedStream.prototype.nextValue = function(v)
{
	if (this.reading)
		this.push(v);
	else
		this.values.push(v);
};

MuxedStream.prototype.done = function()
{
	this.nextValue(null);
};

function StreamNode(stream)
{
	events.EventEmitter.call(this);

	this.stream = stream;
	this.value = undefined;

	this.stream.on('readable', this.readOne.bind(this));
	this.stream.on('end', function()
	{
		this.done = true;
		this.readOne();
	}.bind(this));
}
util.inherits(StreamNode, events.EventEmitter);

StreamNode.prototype.readOne = function()
{
	if (this.value)
		return;
	if (this.done)
	{
		if (this.doneSent)
			return;
		this.emit('value', this.value);
		this.doneSent = true;
		return;
	}

	this.value = this.stream.read();
	if (this.value !== null)
		this.emit('value', this.value);
};

StreamNode.prototype.consume = function()
{
	var v = this.value;
	this.value = undefined;
	setImmediate(this.readOne.bind(this));
	return v;
};


// WARNING! 1-indexed for mathematical ease
// 0 entry is used as a tmp var
function BinaryHeap()
{
	this.heap = [];
	this.size = 0;
	this.heap.push(null);
}

BinaryHeap.prototype.insert = function(node)
{
	var heap = this.heap,
		ptr  = ++(this.size);

	heap.push(node);
	var parent = ptr >> 1;

	while ((ptr > 1) && (heap[parent].value - node.value > 0))
	{
		heap[0] = heap[parent];
		heap[parent] = heap[ptr];
		heap[ptr] = heap[0];
		heap[0] = null;

		ptr = parent;
		parent = ptr >> 1;
	}
};

BinaryHeap.prototype.remove = function(node)
{
	var heap = this.heap;

	for (var i = 1; i < heap.length; i++)
	{
		if (heap[i] === node)
		{
			this.bubble(i);
			return true;
		}
	}

	return false;
};

BinaryHeap.prototype.removeHead = function()
{
	if (this.size === 0)
		return undefined;

	var head = this.heap[1];
	this.bubble(1);
	return head;
};

BinaryHeap.prototype.bubble = function(idx)
{
	this.heap[idx] = this.heap[this.size--];
	this.minHeapify(idx);
};

BinaryHeap.prototype.minHeapify = function(idx)
{
	var heap = this.heap;

	while (true)
	{
		var left = idx << 1,
			right = left + 1,
			min = idx;

		if ((left <= this.size) && ((heap[left].value - heap[min].value) < 0))
			min = left;

		if ((right <= this.size) && ((heap[right].value - heap[min].value) < 0))
			min = right;

		if (min !== idx)
		{
			heap[0] = heap[idx];
			heap[idx] = heap[min];
			heap[min] = heap[0];
			heap[0] = null;
			idx = min;
		}
		else
		{
			break;
		}
	}
};

// wait for everybody to have 1 value
// put streams into a heap with first values
// A: pick the smallest one off & put it into the result queue
// read a value off the smallest stream & update the heap
// goto A
// as streams end, remove them from the heap
// when no streams left, return result

function Muxer(streams)
{
	assert(Array.isArray(streams), 'Muxer() requires an array of readable streams');
	this.muxed = new MuxedStream();
	this.minheap = new BinaryHeap();
	this.wrappers = [];
	this.readyCount = 0;

	for (var i = 0; i < streams.length; i++)
	{
		var wrapped = new StreamNode(streams[i]);
		wrapped.once('value', this.wrapperReady.bind(this));
		this.wrappers.push(wrapped);
	}
}

Muxer.prototype.wrapperReady = function()
{
	this.readyCount++;
	if (this.readyCount < this.wrappers.length)
		return;

	for (var i = 0; i < this.wrappers.length; i++)
		this.minheap.insert(this.wrappers[i]);

	this.emitNextValue();
};

Muxer.prototype.rebalance = function(v)
{
	if (v)
		this.minheap.minHeapify(1);
	else
	{
		this.minheap.removeHead();
		if (this.minheap.size === 0)
			this.muxed.done();
	}
	this.emitNextValue();
};

Muxer.prototype.emitNextValue = function()
{
	var head = this.minheap.heap[1];
	head.once('value', this.rebalance.bind(this));
	var v = head.consume();

	if (v === null)
	{
		// REMOVE
		console.log('generate stream', v, head.done);
	}
	else
	{
		this.muxed.nextValue(v);
	}
};

function muxSortedStreams(streams)
{
	var m = new Muxer(streams);
	return m.muxed;
}

module.exports =
{
	muxStreams:  muxSortedStreams,
	BinaryHeap:  BinaryHeap,
	StreamNode:  StreamNode,
	MuxedStream: MuxedStream,
	Muxer:       Muxer
};
