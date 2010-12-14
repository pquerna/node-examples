/* This code is PUBLIC DOMAIN, and is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND. See the accompanying 
 * LICENSE file.
 */

var dgram = require('dgram');
var slog = require('sys').log;
var path = require('path');
var fs = require('fs');

var SERVER_HOST='127.0.0.1';
var SERVER_PORT=1069;


var opcodes = {OPCODE_RRQ: 1,
  OPCODE_WRQ: 2,
  OPCODE_DATA: 3,
  OPCODE_ACK: 4,
  OPCODE_ERROR: 5};

var sessions = {};
var sock = null;

function log(peer, msg) {
  slog("[" + peer.address + ":" + peer.port + "] "+ msg);
}

function decodeOp(msg, peer) {
  if (msg.length < 4) {
    log(peer, 'Message too short to be valid.');
    return null;
  }

  if (msg[0] !== 0) {
    log(peer, 'Invalid Opcode, no leading zero.');
    return null;
  }

  var b = msg[1];

  for (var op in opcodes) {
    if (opcodes.hasOwnProperty(op)) {
      if (b == opcodes[op]) {
        return op;
      }
    }
  }

  log(peer, 'Invalid Opcode, no such opcode '+ b);
  return null;
}

function clearSession(peer) {
  var key = peer.address + ":" + peer.port;
  delete sessions[key];
}

function startSession(peer, file) {
  var key = peer.address + ":" + peer.port;
  sessions[key] = {'peer': peer, 'file': file};
  sendBlock(peer, file, 1);
}

function continueSession(peer, block) {
  var key = peer.address + ":" + peer.port;
  var s =  sessions[key];
  if (s !== undefined) {
    sendBlock(peer, s.file, block);
  }
  else {
    log(peer, 'Ack for unknown session');
  }
}

var ERR_UNDEFINED = 0; /* Not defined, see error message (if any). */
var ERR_FILE_NOT_FOUND = 1; /* File not found. */
var ERR_ACCESS_VIOLATION = 2; /* Access violation. */
var ERR_DISK_FULL = 3; /* Disk full or allocation exceeded. */
var ERR_ILLEGAL_OPERATION = 4; /* Illegal TFTP operation. */
var ERR_UNKNOWN_TRANSFER = 5; /* Unknown transfer ID. */
var ERR_FILE_EXISTS = 6; /* File already exists. */
var ERR_NO_SUCH_USER = 7; /* No such user. */

function sendError(peer, errorcode, msg) {
  clearSession(peer);
  if (msg === undefined) {
    msg = "";
  }
  var buf = new Buffer(6 + msg.length);
  buf[0] = 0;
  buf[1] = opcodes.OPCODE_ERROR;
  buf[2] = 0;
  buf[3] = errorcode;
  buf.write(msg, 4);
  buf[4 + msg.length] = 0;
  sock.send(buf, 0, buf.length, peer.port, peer.address);
}

function getString(buf) {
  var slen;
  for (slen = 0; slen < buf.length; slen++) {
    if (buf[slen] === 0) {
      break;
    }
  }

  return [slen, buf.toString('ascii', 0, slen)];
}

function sendBlock(peer, file, block) {
  log(peer, 'Sending block '+ block + " of "+ file);

  fs.open(file, 'r', function(err, fp) {
    if (err) {
      log(peer, "Error opening file: "+ err);
      sendError(peer, ERR_FILE_NOT_FOUND, "Can't open file: "+ file);
      return;
    }
    var buf = new Buffer(4 + 512);
    fs.read(fp, buf, 4, 512, ( block - 1 ) * 512, function(err, bytesRead) {
      if (err) {
        log(peer, "Error reading file: "+ err);
        sendError(peer, ERR_UNDEFINED, err);
        return;
      }
      buf[0] = 0;
      buf[1] = opcodes.OPCODE_DATA;
      buf[2] = (block >> 8) & 0xFF;
      buf[3] = block & 0xFF;
      sock.send(buf, 0, 4 + bytesRead, peer.port, peer.address);
      fs.close(fp);
    });
  });
}

sock = dgram.createSocket("udp4", function (msg, peer) {
  var key = peer.address + ":" + peer.port;
  var op = decodeOp(msg, peer);
  var buf = null;

  if (op === null) {
    sendError(peer, ERR_UNDEFINED, 'Unable to decode opcode');
    return;
  }

  log(peer, 'OP '+ op);
  switch (op) {
    case "OPCODE_RRQ":
      buf = msg.slice(2);
      var tmp = getString(buf);
      buf = buf.slice(tmp[0]+1);

      var filename = tmp[1];
      tmp = getString(buf);
      var mode = tmp[1];
      log(peer, "requested file: "+ filename);
      log(peer, "mode: "+ mode);
      path.exists(filename, function (exists) {
        if (exists) {
          startSession(peer, filename);
        }
        else {
          sendError(peer, ERR_FILE_NOT_FOUND, "no such file: "+ filename);
        }
      });
      break;
    case "OPCODE_WRQ":
      sendError(peer, ERR_ACCESS_VIOLATION, 'Read only tftp server');
      break;
    case "OPCODE_DATA":
      sendError(peer, ERR_ACCESS_VIOLATION, 'Read only tftp server');
      break;
    case "OPCODE_ACK":
      buf = msg.slice(2);
      var block = (parseInt(buf[0]) << 8) +parseInt(buf[1]);
      continueSession(peer, block + 1);
      break;
    case "OPCODE_ERROR":
      clearSession(peer);
      break;
  }
});

sock.on('listening', function() {
  slog('Bound to '+ SERVER_HOST + ':' + SERVER_PORT);
});

sock.bind(SERVER_PORT, SERVER_HOST);
