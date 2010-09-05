#!/usr/bin/env node
/* This code is PUBLIC DOMAIN, and is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND. See the accompanying 
 * LICENSE file.
 */

var http = require('http');
var sys = require('sys');
var destination = "nodejs.org";

http.createServer(function(req, res) {
  var proxy = http.createClient(80, destination);
  var preq = proxy.request(req.method, req.url, req.headers);

  console.log(req.connection.remoteAddress +" "+ req.method +" "+req.url);
  preq.on('response', function(pres) {
    res.writeHead(pres.statusCode, pres.headers);
    sys.pump(pres, res);
    pres.on('end', function() {
      preq.end();
      res.end();
    })
  });
  req.on('data', function(chunk) {
    preq.write(chunk, 'binary');
  });
  req.on('end', function() {
    preq.end();
  });
}).listen(8080);
