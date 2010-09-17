/* This code is PUBLIC DOMAIN, and is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND. See the accompanying 
 * LICENSE file.
 */

function ArrayQueue()
{
  this.q = [];
}

ArrayQueue.prototype.insert = function(value)
{
  this.q.push(value);
}

ArrayQueue.prototype.shift = function()
{
  if (this.q.length != 0) {
    return this.q.shift();
  }
  else {
    return null;
  }
}

exports.createQueue = function()
{
  return new ArrayQueue();
}