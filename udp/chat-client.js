/* This code is PUBLIC DOMAIN, and is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND. See the accompanying 
 * LICENSE file.
 */

var Buffer = require('buffer').Buffer;
var dgram = require('dgram');

var stdin = process.openStdin();
stdin.setEncoding('utf8');

SERVER_HOST = '127.0.0.1';
SERVER_PORT = 7000;

var sock = dgram.createSocket("udp4");

stdin.on('data', function (input) {
  var buf = new Buffer(input);
  sock.send(buf, 0, buf.length, SERVER_PORT, SERVER_HOST);
});

sock.on('message', function (buf) {
  process.stdout.write(buf.toString());
});
