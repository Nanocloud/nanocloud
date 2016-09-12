var express = require('express');
var app = express();
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var libvirt = require('libvirt');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var xml = require('xml');
var uuid = require('uuid');

var CONNECT_URI = 'qemu:///session';
var hypervisor = new libvirt.Hypervisor(CONNECT_URI);

function getHardDriveJson(drive) {
  var machineDisk = [];
  machineDisk.push({_attr: {type: 'file', device: 'disk'}});
  machineDisk.push({
    driver: {
      _attr: {
        name: 'qemu',
        type: 'qcow2'
      }
    }
  });
  machineDisk.push({
    source: {
      _attr: {
        file: drive
      }
    }
  });
  machineDisk.push({
    target: {
      _attr: {
        dev: 'hda'
      }
    }
  });

  return {
    disk: machineDisk
  };
}

function getNetworkingJson() {
  var machineInterfaces = [];

  machineInterfaces.push({_attr: {type: 'network'}});
  machineInterfaces.push({
    source: {
      _attr: {
        network: 'default'
      }
    }
  });
  machineInterfaces.push({
    mac: {
      _attr: {
        address: '24:42:53:21:52:45'
      }
    }
  });

  return {
    interface: machineInterfaces
  };
}


function getMachineXML(machineDescription) {

  var domainDescription = [];
  domainDescription.push({_attr: {type: 'qemu'}});

  domainDescription.push({name: machineDescription.name});
  domainDescription.push({uuid: uuid.v4()});
  domainDescription.push({memory: machineDescription.memory});
  domainDescription.push({currentMemory: machineDescription.memory});
  domainDescription.push({vcpu: machineDescription.cpu});

  domainDescription.push({
    os: [{
      type: [{
        _attr: {
          arch: 'i686',
          machine: 'pc'
        },
      }, 'hvm'],
    }, {
      boot: [{
        _attr: {
          dev: 'hd'
        }
      }]
    }]
  });

  var machineDevices = [];
  machineDevices.push({emulator: '/usr/bin/qemu-system-x86_64'});
  machineDevices.push(getHardDriveJson(machineDescription.drive));
  // machineDevices.push(getNetworkingJson());
  machineDevices.push({
    graphics: {
      _attr: {
        type: 'vnc',
        port: '-1'
      },
    }
  });

  domainDescription.push({
    devices: machineDevices
  });

  var domain_json = [{
    domain: domainDescription
  }];

  console.log(xml(domain_json, '    '));
  return xml(domain_json);
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
  var machineXML = getMachineXML({
    cpu: machineDescription.cpu || 2,
    memory: machineDescription.memory || 4096000,
    name: machineDescription.name || 'Driver libvirt',
    drive: machineDescription.drive || ''
  });

  return new Promise((resolve, reject) => {
    hypervisor.createDomain(machineXML, function(err, domain) {
      if (err) {
        reject(err);
      }
      resolve(domain);
    });
  })
    .then((domain) => {
      return new Promise((resolve) => {
        domain.getUUID(function(err, uuid) {
          domain.getName(function(err, name) {
            res.status = 201;
            return resolve({
              id: uuid,
              name: name,
              status: 'booting'
            });
          });
        });
      });
    })
    .then((domainJson) => {
      return res.json(domainJson);
    })
    .catch((err) => {
      res.status = 400;
      return res.send(err);
    });
});

app.get('/machines', function (req, res) {
  var machines = [];

  return new Promise((resolve, reject) => {
    hypervisor.listDefinedDomains(function(err, domains_id) {
      if (err) {
        reject(err);
      } else {
        resolve(domains_id);
      }
    });
  })
    .then((domains_id) => {
      var domain_promises = [];
      domains_id.forEach(function(domain_id) {
        domain_promises.push(new Promise((resolve) => {
          hypervisor.lookupDomainById(domain_id, function(err, domain) {
            domain.getUUID(function(err, uuid) {
              domain.getName(function(err, name) {
                return resolve({
                  id: uuid,
                  name: name,
                  status: 'stopped'
                });
              });
            });
          });
        }));
      });

      return Promise.all(domain_promises);
    })
    .then((inactive_machines) => {
      machines = inactive_machines;
      return new Promise((resolve, reject) => {
        hypervisor.listActiveDomains(function(err, domains_id) {
          if (err) {
            reject(err);
          } else {
            resolve(domains_id);
          }
        });
      });
    }).then((domains_id) => {
      var domain_promises = [];
      domains_id.forEach(function(domain_id) {
        domain_promises.push(new Promise((resolve) => {
          hypervisor.lookupDomainById(domain_id, function(err, domain) {
            domain.getUUID(function(err, uuid) {
              domain.getName(function(err, name) {
                return resolve({
                  id: uuid,
                  name: name,
                  status: 'running'
                });
              });
            });
          });
        }));
      });

      return Promise.all(domain_promises);
    })
    .then((active_machines) => {
      return new Promise((resolve) => {
        active_machines.forEach(function(active_machine) {
          machines.push(active_machine);
        });
        resolve();
      });
    })
    .then(() => {
      return res.send(machines);
    });
});

app.delete('/machine/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', function (req, res) {

  console.log('DELETE ' + req.path);
  var machineId = req.path.substr(9);

  console.log(machineId);

  return new Promise((resolve, reject) => {
    hypervisor.lookupDomainByUUID(machineId, function(err, domain) {
      if (err) {
        reject(err);
      }
      resolve(domain);
    });
  })
    .then((domain) => {
      return new Promise((resolve, reject) => {
        domain.getUUID(function(err, uuid) {
          domain.getName(function(err, name) {
            domain.shutdown(function(err) {
              if (err) {
                return reject(err);
              }
              return resolve({
                id: uuid,
                name: name,
                status: 'stopping'
              });
            });
          });
        });
      });
    })
    .then((domain) => {
      return res.json(domain);
    })
    .catch((err) => {
      res.status = 404;
      return res.send(err);
    });
});

app.get('/', function (req, res) {
  return res.send('Libvirt manager');
});

app.listen(3000, function () {
  hypervisor.connect(function(err) {
    if (err) {
      console.log('Could not connect to livirt socket');
      app.close();
    } else {
      console.log('Libvirt Manager listening on port 3000');
    }
  });
});
