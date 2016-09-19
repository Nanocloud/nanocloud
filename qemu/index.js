var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var uuid = require('uuid');
var exec = require('child_process').exec;


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
  var cmd = `qemu-system-x86_64 \
    -nodefaults \
    -name "${name}" \
    -m ${machineDescription.memory} \
    -smp ${machineDescription.cpu} \
    -machine accel=kvm \
    -drive file=${machineDescription.drive},format=qcow2 \
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

app.delete('/machines/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', function (req, res) {

  var machineId = req.path.substr(10);

  exec('PID=$(ps aux | grep "' + machineId + ' " | grep qemu | awk \'{ print $2 }\' | tr "\\n" " ") ; kill ${PID}',
    () => {});

  return res.json({
    id: machineId,
    status: 'stopping'
  });

});

app.get('/', function (req, res) {
  return res.send('Qemu manager');
});

app.listen(3000, function () {
  // Qemu Manager listen on port 3000
});
