/*global describe:true, it:true, before:true, after:true */

var
	demand = require('must'),
	muxer     = require('../lib/keymuxer'),
	Heap      = muxer.BinaryHeap,
	IntStream = require('./mocks/intstream')
	;

function hasHeapProperty(m)
{
	var heap = m.heap;

	for (var i = 1; i <= m.size; i++)
	{
		var current = heap[i];
		var left = i << 1;
		var right = left + 1;
		var parent = i >> 1;

		if (parent > 0)
			heap[parent].value.must.be.lte(current.value);

		if (left <= m.heap.size)
			current.value.must.be.below(heap[left].value);

		if (right <= m.heap.size)
		{
			current.value.must.be.lte(heap[right].value);
			heap[left].value.must.be.lte(heap[right].value);
		}
	}

	return true;
}

describe('min BinaryHeap', function()
{
	var testItems = [];
	var testmin;
	for (var i = 0; i < 32; i++)
	{
		var value = Math.floor(Math.random() * 1000);

		if ((testmin === undefined)|| (value < testmin))
			testmin = value;
		testItems.push({ id: ''+value, value: value });
	}

	it('can be constructed', function()
	{
		var m = new Heap();
		m.heap.must.be.an.array();
		m.size.must.equal(0);
		m.heap.length.must.equal(1);
		demand(m.heap[0]).be.null();
	});

	it('insert() adds a node', function()
	{
		var item = { id: 'item', value: 3};
		var m = new Heap();
		m.insert(item);

		m.size.must.equal(1);
		m.heap.length.must.equal(2);
		m.heap[1].must.be.an.object();
		m.heap[1].id.must.equal(item.id);
	});

	it('insert() keeps the heap sorted', function()
	{
		var m = new Heap();
		m.insert({ id: 'max', value: 42});
		m.insert({ id: 'min', value: 2});

		m.size.must.equal(2);
		m.heap.length.must.equal(3);
		m.heap[1].must.be.an.object();
		m.heap[1].id.must.equal('min');
		m.heap[2].id.must.equal('max');
	});

	it('hasHeapProperty() is a valid test', function()
	{
		function badheap()
		{
			var m = new Heap();
			m.heap = testItems;
			m.size = testItems.length;
			return hasHeapProperty(m);
		}

		badheap.must.throw();
	});

	it('insert() keeps it sorted through a handful of inserts', function()
	{
		var m = new Heap();
		for (var i = 0; i < testItems.length; i++)
		{
			m.insert(testItems[i]);
		}

		m.size.must.equal(testItems.length);
		m.heap.length.must.equal(testItems.length + 1);
		m.heap[1].must.be.an.object();
		m.heap[1].value.must.equal(testmin);
		m.heap[m.size].must.be.an.object();

		hasHeapProperty(m).must.be.true();
	});

	it('minHeapify() keeps the heap ordered after a value update', function()
	{
		var m = new Heap();
		for (var i = 0; i < testItems.length; i++)
		{
			m.insert(testItems[i]);
		}

		m.heap[1].value = 20020202;
		function badheap()
		{
			return hasHeapProperty(m);
		}
		badheap.must.throw();
		m.minHeapify(1);
		hasHeapProperty(m).must.be.true();
		m.size.must.equal(testItems.length);
	});

	it('bubble(i) removes the node at i & rebalances', function()
	{
		var m = new Heap();
		for (var i = 0; i < testItems.length; i++)
			m.insert(testItems[i]);

		m.bubble(3);
		m.size.must.equal(testItems.length - 1);
		hasHeapProperty(m).must.be.true();
	});

	it('removeHead() removes the head node', function()
	{
		var m = new Heap();
		for (var i = 0; i < testItems.length; i++)
			m.insert(testItems[i]);

		var head = m.removeHead();
		m.size.must.equal(testItems.length - 1);
		hasHeapProperty(m).must.be.true();
		head.value.must.be.lte(m.heap[1].value);
	});

	it('bubble() can be called on the last node', function()
	{
		var m = new Heap();
		for (var i = 0; i < testItems.length; i++)
			m.insert(testItems[i]);

		m.bubble(testItems.length);
		m.size.must.equal(testItems.length - 1);
		hasHeapProperty(m).must.be.true();
	});
});

describe('Muxer', function()
{
	it('can be constructed', function()
	{
		var m = new muxer.Muxer([]);
	});

});

describe('muxStreams()', function()
{
	it('takes an array of readable streams', function()
	{
		function bad() { return muxer.muxStreams(); }
		bad.must.throw();
	});

	it('returns a MuxedStream', function()
	{
		var result = muxer.muxStreams([]);
		result.must.be.instanceOf(muxer.MuxedStream);
	});

	it('reads values until all streams are done, one stream variation', function(done)
	{
		this.timeout(5000);
		var desired = 10;
		var values = [];

		var result = muxer.muxStreams([new IntStream(desired)]);
		result.on('data', function(v)
		{
			values.push(v);
		})
		.on('end', function()
		{
			values.length.must.equal(desired);
			for (var i = 0; i < values.length - 1; i++)
			{
				values[i].must.be.lte(values[i + 1]);
			}
			done();
		});
	});

	it('muxes two streams into sorted order', function(done)
	{
		this.timeout(10000);
		var desired = 10;
		var values = [];

		var result = muxer.muxStreams([new IntStream(desired), new IntStream(desired)]);
		result.on('data', function(v)
		{
			values.push(v);
		})
		.on('end', function()
		{
			values.length.must.equal(desired * 2);
			for (var i = 0; i < values.length - 1; i++)
			{
				values[i].must.be.lte(values[i + 1]);
			}
			done();
		});
	});

	it('muxes three longer streams into sorted order', function(done)
	{
		this.timeout(10000);
		var desired = 100;
		var streams = [];
		for (var i = 0; i < 3; i++)
			streams.push(new IntStream(desired));

		var values = [];

		var result = muxer.muxStreams(streams);
		result.on('data', function(v)
		{
			values.push(v);
		})
		.on('end', function()
		{
			values.length.must.equal(desired * 3);
			for (var i = 0; i < values.length - 1; i++)
			{
				values[i].must.be.lte(values[i + 1]);
			}
			done();
		});
	});

	it('muxes ten longer streams into sorted order', function(done)
	{
		this.timeout(10000);
		var desired = 100;
		var streams = [];
		for (var i = 0; i < 10; i++)
			streams.push(new IntStream(desired));

		var values = [];

		var outstream = muxer.muxStreams(streams);
		outstream.on('data', function(v)
		{
			values.push(v);
		})
		.on('end', function()
		{
			values.length.must.equal(desired * 10, 'expected 1000 items');
			for (var i = 0; i < values.length - 1; i++)
			{
				values[i].must.be.lte(values[i + 1]);
			}
			done();
		});
	});

	it('handles a stream with no data', function(done)
	{
		var outstream = muxer.muxStreams([new IntStream(0)]);
		var values = [];

		outstream.on('data', function(v)
		{
			values.push(v);
		})
		.on('end', function()
		{
			values.length.must.equal(0);
			done();
		});
	});


	it('handles several streams with 1 item', function(done)
	{
		var values = [];

		var outstream = muxer.muxStreams([new IntStream(1), new IntStream(0), new IntStream(3)]);
		outstream.on('data', function(v)
		{
			values.push(v);
		})
		.on('end', function()
		{
			values.length.must.equal(4);
			done();
		});
	});
});
