/* This code is PUBLIC DOMAIN, and is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND. See the accompanying 
 * LICENSE file.
 */

var assert = require('assert');

var queues = {
  'array': require('./array'),
  'array_offset': require('./array_offset')
};

function DummyObject(value)
{
  this.foo = value;
}

DummyObject.prototype.some_method = function()
{
  return this.foo;
}

function benchmark_run(q, pull_size, insert_size, total_size)
{
  var i = 0;
  var j, v;

  while (i < total_size) {
    for (j = 0; j < insert_size && i < total_size; j++, i++) {
      q.insert(new DummyObject(i));
    }
    for (j = 0; j < pull_size; j++) {
      v = q.shift();
      if (v !== null) {
        delete v;
      }
    }
  }

  while (true) {
    v = q.shift();
    if (v === null) {
      break;
    }
    delete v;
  };
}

function benchmark_method(m)
{
  var maxsize = 100000;
  var start = process.memoryUsage();
  var q = m.createQueue();
  benchmark_run(q, 1, 10, maxsize);
  q.clear();
  benchmark_run(q, 10, 10, maxsize);
  q.clear();
  benchmark_run(q, 10, 1000, maxsize);
  q.clear();
  benchmark_run(q, 10, 1, maxsize);
  q.clear();
  benchmark_run(q, 100, 1, maxsize);
  q.clear();
  var end = process.memoryUsage();
  delete q;
  return [start, end];
}

for (k in queues) {
  var m = queues[k];
  var start = Date.now();
  mem = benchmark_method(m);
  var end = Date.now();
  delete q;
  console.log(k, "took", end-start, 'ms', 'heapdiff:', mem[0].heapUsed - mem[1].heapUsed);
  console.log()
}