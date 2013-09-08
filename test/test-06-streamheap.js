/*global describe:true, it:true, before:true, after:true */

var
	chai      = require('chai'),
	assert    = chai.assert,
	expect    = chai.expect,
	should    = chai.should(),
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
			assert.isTrue(heap[parent].value <= current.value, 'doh value less than parent');

		if (left <= m.heap.size)
			assert.isTrue(current.value < heap[left].value, 'doh value greater than left child');

		if (right <= m.heap.size)
		{
			assert.isTrue(current.value <= heap[right].value, 'doh value greater than right child');
			assert.isTrue(heap[left].value <= heap[right].value, 'doh right > left');
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
		assert.isArray(m.heap);
		assert.equal(m.size, 0);
		assert.equal(m.heap.length, 1);
		assert.equal(m.heap[0], null);
	});

	it('insert() adds a node', function()
	{
		var item = { id: 'item', value: 3};
		var m = new Heap();
		m.insert(item);

		assert.equal(m.size, 1);
		assert.equal(m.heap.length, 2);
		assert.isObject(m.heap[1]);
		assert.equal(m.heap[1].id, item.id);
	});

	it('insert() keeps the heap sorted', function()
	{
		var m = new Heap();
		m.insert({ id: 'max', value: 42});
		m.insert({ id: 'min', value: 2});

		assert.equal(m.size, 2);
		assert.equal(m.heap.length, 3);
		assert.isObject(m.heap[1]);
		assert.equal(m.heap[1].id, 'min');
		assert.equal(m.heap[2].id, 'max');
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

		assert.throws(badheap);
	});

	it('insert() keeps it sorted through a handful of inserts', function()
	{
		var m = new Heap();
		for (var i = 0; i < testItems.length; i++)
		{
			m.insert(testItems[i]);
		}

		assert.equal(m.size, testItems.length);
		assert.equal(m.heap.length, testItems.length + 1);
		assert.isObject(m.heap[1]);
		assert.equal(m.heap[1].value, testmin);
		assert.isObject(m.heap[m.size]);

		assert.isTrue(hasHeapProperty(m));
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
		assert.throws(badheap);
		m.minHeapify(1);
		assert.isTrue(hasHeapProperty(m));
		assert.equal(m.size, testItems.length);
	});

	it('bubble(i) removes the node at i & rebalances', function()
	{
		var m = new Heap();
		for (var i = 0; i < testItems.length; i++)
			m.insert(testItems[i]);

		m.bubble(3);
		assert.equal(m.size, testItems.length - 1);
		assert.isTrue(hasHeapProperty(m));
	});

	it('removeHead() removes the head node', function()
	{
		var m = new Heap();
		for (var i = 0; i < testItems.length; i++)
			m.insert(testItems[i]);

		var head = m.removeHead();
		assert.equal(m.size, testItems.length - 1, 'item was not removed');
		assert.isTrue(hasHeapProperty(m), 'result is not heap-shaped!');
		assert.ok(head.value <= m.heap[1].value, 'the new head is smaller than the one we popped off!');
	});

	it('bubble() can be called on the last node', function()
	{
		var m = new Heap();
		for (var i = 0; i < testItems.length; i++)
			m.insert(testItems[i]);

		m.bubble(testItems.length);
		assert.equal(m.size, testItems.length - 1);
		assert.isTrue(hasHeapProperty(m));
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
		assert.throws(bad);
	});

	it('returns a MuxedStream', function()
	{
		var result = muxer.muxStreams([]);
		assert.ok(result instanceof muxer.MuxedStream);
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
			assert.equal(values.length, desired);
			for (var i = 0; i < values.length - 1; i++)
			{
				assert.isTrue(values[i] <= values[i + 1], 'wtf not sorted! ' + values[i] + ' ' + values[i + 1] );
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
			assert.equal(values.length, desired * 2);
			for (var i = 0; i < values.length - 1; i++)
			{
				assert.isTrue(values[i] <= values[i + 1], 'wtf not sorted!');
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
			assert.equal(values.length, desired * 3);
			for (var i = 0; i < values.length - 1; i++)
			{
				assert.isTrue(values[i] <= values[i + 1], 'wtf not sorted!');
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
			assert.equal(values.length, desired * 10, 'expected 1000 items');
			for (var i = 0; i < values.length - 1; i++)
			{
				assert.isTrue(values[i] <= values[i + 1], 'wtf not sorted!');
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
			assert.equal(values.length, 0, 'expected 0 items');
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
			assert.equal(values.length, 4, 'expected 4 items');
			done();
		});
	});

});
