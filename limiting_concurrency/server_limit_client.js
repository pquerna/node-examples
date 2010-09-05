#!/usr/bin/env node
/* This code is PUBLIC DOMAIN, and is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND. See the accompanying 
 * LICENSE file.
 */

var http = require('http');
var sys = require('sys');
var destination = "nodejs.org";

var maxClients = 1;
var currentClients = 0;
var _pending = [];

function process_pending()
{
  if (_pending.length > 0) {
    var cb = _pending.shift();
    currentClients++;
    cb(function() {
      currentClients--;
      process.nextTick(process_pending);
    });
  }
}

function client_limit(cb, req, res) 
{
  if (currentClients < maxClients) {
    currentClients++;
    cb(function() {
      currentClients--;
      process.nextTick(process_pending);
    }, req, res);
  }
  else {
    console.log('Overloaded, queuing clients...');
    _pending.push(cb);
  }
}

http.createServer(function(req, res) {
  var bufs = [];
  var done_buffering = false;

  client_limit(function(done){
    var proxy = http.createClient(80, destination);
    var preq = proxy.request(req.method, req.url, req.headers);

    console.log(req.connection.remoteAddress +" "+ req.method +" "+req.url);
    preq.on('response', function(pres) {
      res.writeHead(pres.statusCode, pres.headers);
      sys.pump(pres, res);
      pres.on('end', function() {
        preq.end();
        res.end();
        done();
      });
    });
    function finishreq() {
      bufs.forEach(function(buf){
        preq.write(buf);
      });
      preq.end();
    }

    if (done_buffering) {
      finishreq();
    }
    else {
      req.on('end', function() {
        finishreq();
      });
    }
  });

  req.on('data', function(chunk) {
    var tbuf = new Buffer(chunk.length);
    chunk.copy(tbuf, 0, 0);
    bufs.push(tbuf);
  });

  req.on('end', function() {
    done_buffering = true;
  });

}).listen(8080);
