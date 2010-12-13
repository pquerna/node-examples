/* This code is PUBLIC DOMAIN, and is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND. See the accompanying 
 * LICENSE file.
 */

var Buffer = require('buffer').Buffer;
var dgram = require('dgram')
log = require('sys').log

sock = dgram.createSocket("udp4", function (msg, rinfo) {
  log('got message from '+ rinfo.address +':'+ rinfo.port);
  log('data len: '+ rinfo.size + " data: "+ msg.toString('ascii', 0, rinfo.size));
  sock.close();
});

sock.bind(8000, '0.0.0.0');