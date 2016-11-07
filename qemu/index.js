/**
 * Nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud.
 *
 * Nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const net = require('net');
const drivePath = '/data/';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var uuid = require('uuid');
var exec = require('child_process').exec;
var Promise = require('bluebird');
const request = require('request-promise');

function createImage(backFile, newImage) {
  var cmd = `qemu-img create -f qcow2 -b "${backFile}" "${newImage}"`;

  return new Promise((resolve, reject) => {
    return exec(cmd, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve({
        iaasId: newImage,
        buildFrom:backFile
      });
    });
  });
}

function getPort() {
  getPort.plaza =  ++getPort.plaza || 28000;
  getPort.rdp =  ++getPort.rdp || 29000;
  getPort.vnc =  ++getPort.vnc || 1;

  return ({
    plaza: getPort.plaza,
    rdp: getPort.rdp,
    vnc: getPort.vnc
  });
}

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/machines', upload.array(), function (req, res) {
  var machineDescription = req.body;
  var id = uuid.v4();
  var name = machineDescription.name + '-qemu-' + id;
  var port = getPort();
  var drive = machineDescription.drive;
  createImage(drivePath + drive, drivePath + uuid.v4())
    .then((image) => {
      var cmd = `qemu-system-x86_64 \
    -nodefaults \
    -snapshot \
    -name "${name}" \
    -m ${machineDescription.memory} \
    -smp ${machineDescription.cpu} \
    -machine accel=kvm \
    -drive file=${image.iaasId},format=qcow2 \
    -vnc :${port.vnc} \
    -usb -device usb-tablet \
    -net nic,vlan=0,model=virtio \
    -net user,vlan=0,hostfwd=tcp::${port.plaza}-:9090,hostfwd=tcp::${port.rdp}-:3389 \
    -monitor unix:/data/${id}.socket,server,nowait \
    -vga qxl \
  `;

      exec(cmd, () => {});

      return res.json({
        id: id,
        name: name,
        plazaPort: port.plaza,
        rdpPort: port.rdp,
        vncPort: port.vnc,
        status: 'booting'
      });
    });
});

app.get('/machines/status/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', function (req, res) {
  // we cut the 17 first characters of the path '/mahines/status/'
  var machineId = req.path.substr(17);
  let machineStatus = null;
  return new Promise((resolve) => {
    let socket = net.connect({path: drivePath + machineId + '.socket'}, () => {
      return resolve(socket);
    });
  })
    .then((socket) => {
      return new Promise((resolve) => {
        socket.write('info status\n', () => {
          return resolve();
        });
      })
        .then(() => {
          return new Promise((resolve) => {
            socket.on('data', (data) => {
              var lines = data.toString().split('\n');
              lines.forEach(function(line) {
                if ( line.substr(0,9) === 'VM status' ) {
                  machineStatus = line.split(':')[1].substr(1);
                  return resolve();
                }
              });
            });
          });
        })
        .then(() => {
          /**
           * Qemu 'info status' command return the status of the machine. it can be
           * 'running' or 'paused'.
           * But it add a '\r' or other character at the end of this string.
           * so we received something like this: 'running\r'.
           * We need to return a correct string, so we need to know what is the
           * response, if it's paused or running, to know how many characters we need
           * to split.
           * example:
           *    'paused\r' => we only want the 6 firsts characters.
           *    'running\r' => we only want the 7 firsts characters.
           */
          machineStatus = machineStatus.substr(0, (machineStatus.substr(0, 6) === 'paused') ? 6 : 7);
          socket.end();
          return res.send({
            id: machineId,
            status: machineStatus
          });
        });
    });
});

app.post('/machines/start/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', function (req, res) {
  var machineId = req.path.substr(16);
  let socket = net.connect({path: drivePath + machineId + '.socket'}, () => {
    socket.write('cont\n', () => {
      socket.end();
      return res.send({
        id: machineId,
        status: 'running'
      });
    });
  });
});

app.post('/machines/stop/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', function (req, res) {
  var machineId = req.path.substr(15);
  let socket = net.connect({path: drivePath + machineId + '.socket'}, () => {
    socket.write('stop\n', () => {
      socket.end();
      return res.send({
        id: machineId,
        status: 'stopped'
      });
    });
  });
});

app.delete('/machines/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', function (req, res) {

  var machineId = req.path.substr(10);
  let socket = net.connect({path: '/data/' + machineId + '.socket'}, () => {
    socket.write('system_powerdown\n', () => {
      socket.end();
      return res.json({
        id: machineId,
        status: 'stopping'
      });
    });
  });
});

app.patch('/machines/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', function (req, res) {
  var params = req.body;
  let requestOptions = {
    url: 'http://' + params.ip + ':' + params.plazaPort + '/restart',
    json: true,
    method: 'GET'
  };
  return request(requestOptions)
    .then(() => {
      return res.json({
        status: 'rebooting'
      });
    });
});

app.post('/images', upload.array(), function (req, res) {
  var params = req.body;

  if (!params.buildFrom || !params.iaasId) {
    res.status = 400;
    return res.send('Some parameters are missing');
  }

  let vmId = null;
  return new Promise((resolve) => {
    let socket = net.connect({path: '/data/' + params.buildFrom + '.socket'}, () => {
      return resolve(socket);
    });
  })
    .then((socket) => {
      return new Promise((resolve) => {
        socket.write('info block\n', () => {
          return resolve();
        });
      })
        .then(() => {
          return new Promise((resolve) => {
            socket.on('data', (data) => {
              var lines = data.toString().split('\n');
              lines.forEach(function(line) {
                if ( line.substr(4,6) === 'Backin' ) {
                  vmId = line.split(':')[1].substr(5,42);
                  return resolve();
                }
              });
            });
          });
        })
        .then(() => {
          return new Promise((resolve) => {
            socket.write('stop\n', () => {
              return resolve();
            });
          });
        })
        .then(() => {
          return new Promise((resolve) => {
            socket.write('commit all\n', () => {
              return resolve();
            });
          });
        })
        .then(() => {
          return createImage(vmId, drivePath + params.iaasId);
        })
        .then(() => {
          return new Promise((resolve) => {
            socket.write('cont\n', () => {
              return resolve();
            });
          });
        })
        .then(() => {
          return new Promise((resolve) => {
            socket.end();
            return resolve();
          });
        })
        .then(() => {
          res.status = 200;
          return res.send({
            buildFrom: params.buildFrom,
            iaasId: params.iaasId
          });
        })
        .catch((err) => {
          res.status = 400;
          return res.send(err);
        });
    });
});

app.delete('/images', function(req, res) {
  var imageToDelete = req.body.iaasId;
  var cmd = `rm -f ${drivePath}${imageToDelete}`;

  exec(cmd, () => {});
  res.status = 200;
  return res.send({iaasId: imageToDelete});
});

app.get('/', function (req, res) {
  return res.send('Qemu manager');
});

app.listen(3000, function () {
  // Qemu Manager listen on port 3000
});
