/* This code is PUBLIC DOMAIN, and is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND. See the accompanying 
 * LICENSE file.
 */

function ArrayOffsetQueue()
{
  this.offset = 0;
  this.head = [];
  this.tail = [];
}

ArrayOffsetQueue.prototype.clear = function()
{
  this.offset = 0;
  this.head = [];
  this.tail = [];
}

ArrayOffsetQueue.prototype.insert = function(value)
{
  this.tail.push(value);
}

ArrayOffsetQueue.prototype.shift = function()
{
  if (this.offset === this.head.length) {
    var tmp = this.head;
    this.head = this.tail;
    this.tail = tmp;
    this.tail.length = 0;
    this.offset = 0;
    if (this.head.length === 0) {
      return null;
    }
  }
  return this.head[this.offset++];
}

exports.createQueue = function()
{
  return new ArrayOffsetQueue();
}