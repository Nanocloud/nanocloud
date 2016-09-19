var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var uuid = require('uuid');
var exec = require('child_process').exec;
var Promise = require('bluebird');

function createImage(backFile, newImage) {
  var cmd = `qemu-img create -f qcow2 -b ${backFile} ${newImage}`;

  return new Promise((resolve, reject) => {
    return exec(cmd, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve({
        name: newImage,
        buildFrom:backFile
      });
    });
  });
}

function getPort() {
  getPort.plaza =  ++getPort.plaza || 9090;
  getPort.rdp =  ++getPort.rdp || 3389;
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
  createImage(machineDescription.drive, uuid.v4())
    .then((image) => {
      var cmd = `qemu-system-x86_64 \
    -nodefaults \
    -name "${name}" \
    -m ${machineDescription.memory} \
    -smp ${machineDescription.cpu} \
    -machine accel=kvm \
    -drive file=${image.name},format=qcow2 \
    -vnc :${port.vnc} \
    -usb -device usb-tablet \
    -net nic,vlan=0,model=virtio \
    -net user,vlan=0,hostfwd=tcp::${port.plaza}-:9090,hostfwd=tcp::${port.rdp}-:3389 \
    -vga qxl \
  `;

      exec(cmd, () => {});

      return res.json({
        id: id,
        name: name,
        plazaPort: port.plaza,
        rdpPort: port.rdp,
        vncPort: port.vnc,
        status: 'running'
      });
    });
});

app.delete('/machines/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', function (req, res) {

  var machineId = req.path.substr(10);

  exec('IMAGE=$(ps aux | grep "' + machineId + ' " | grep qemu | tr " " "\\n" | grep \'file=\' | awk -F, \'{print $1}\' | awk -F= \'{print $2}\'); rm ${IMAGE}',
    () => {
      exec('PID=$(ps aux | grep "' + machineId + ' " | grep qemu | awk \'{ print $2 }\' | tr "\\n" " ") ; kill ${PID}',
        (err, stdout, stderr) => {
          if (err || stderr) {
            return (err);
          }
        });

      return res.json({
        id: machineId,
        status: 'stopping'
      });
    });
});

app.post('/images', upload.array(), function (req, res) {
  var params = req.body;

  return exec('ps aux | grep "' + params.buildFrom + ' " | grep qemu | tr " " "\\n" | grep \'file=\' | awk -F, \'{print $1}\' | awk -F= \'{print $2}\'',
    (err, stdout) => {
      if (err) {
        res.status = 404;
        return res.send(err);
      }
      return createImage(stdout, params.name)
        .then(() => {
          res.status = 200;
          return res.send({
            buildFrom: params.buildFrom,
            name: params.name
          });
        })
        .catch((err) => {
          res.status = 400;
          return res.send(err);
        });
    });
});

app.get('/', function (req, res) {
  return res.send('Qemu manager');
});

app.listen(3000, function () {
  // Qemu Manager listen on port 3000
});
