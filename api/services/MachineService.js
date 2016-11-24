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
 *
 */

/* global App, ConfigService, BrokerLog, Machine, Image, User, ConfigService, Machine, PlazaService, StorageService, Team, UserMachine */

const _ = require('lodash');
const Promise = require('bluebird');
const ManualDriver = require('../drivers/manual/driver');
const AWSDriver = require('../drivers/aws/driver');
const DummyDriver = require('../drivers/dummy/driver');
const QemuDriver = require('../drivers/qemu/driver');
const OpenstackDriver = require('../drivers/openstack/driver');
const promisePoller = require('promise-poller').default;
const request = Promise.promisify(require('request'));

/**
 * Service responssible of the machine pool
 *
 * @class MachineService
 */

const driverNotInitializedError = new Error('Driver not initialized');
const driverAlreadyInitializedError = new Error('Driver already initialized');

const drivers = {
  manual    : ManualDriver,
  aws       : AWSDriver,
  dummy     : DummyDriver,
  qemu      : QemuDriver,
  openstack : OpenstackDriver
};

/**
 * The underlying driver used by the service.
 *
 * @property _driver
 * @type {Object}
 * @private
 */
let _driver = null;

/**
 * The promise returned by `initialize`. Used to prevent multiple
 * initializtions.
 *
 * @property initializing
 * @type {Promise}
 * @private
 */
let _initializing = null;

/**
 * Returns a Promise that reject `err` if `condition` if false. A resolved
 * Promise otherwise.
 *
 * @method assert
 * @private
 * @param {Boolean} condition The rejection condition
 * @param {Object} err The rejected error if condition is false
 * @return {Promise[Object]}
 */
function assert(condition, err) {
  if (condition) {
    return Promise.resolve();
  } else {
    return Promise.reject(err);
  }
}

/**
 * Initialize the Iaas driver. It uses the `ConfigService` variables:
 *  - iaas: the name of the iaas driver to use
 *
 * @method initialize
 * @return {Promise}
 */
function initialize() {
  return assert(_driver === null, driverAlreadyInitializedError)
    .then(() => {
      if (_initializing) {
        return _initializing;
      }

      _initializing = ConfigService.get('iaas', 'instancesSize')
        .then((config) => {
          return Image.findOrCreate({
            buildFrom: null
          }, {
            iaasId: null,
            name: 'Default',
            buildFrom: null,
            deleted: false,
            instancesSize: config.instancesSize,
          })
            .then(() => {
              _driver = new (drivers[config.iaas])();
              return _driver.initialize()
                .then(() => {
                  updateMachinesPool();
                  return null;
                });
            });
        });

      return _initializing;
    });
}

/**
 * Retreive a machine for the specified user. If the user already has a machine,
 * then this machine is returned. Otherwise, if a machine is available, it is
 * affected to the user. Fails if there is no available machine.
 *
 * @method getMachineForUser
 * @param {User} The user associated to the machine
 * @param {Image} The image associated to the machine
 * @return {Promise[Machine]} The user's machine
 */
function getMachineForUser(user, image) {
  return assert(!!_driver, driverNotInitializedError)
    .then(() => {
      return ConfigService.get('creditLimit');
    })
    .then((config) => {
      if (config.creditLimit !== '' && parseFloat(user.credit) >= parseFloat(config.creditLimit)) {
        return new Promise.reject('Exceeded credit');
      }
    })
    .then(() => {
      return Machine.find({ image: image.id }).populate('users', { id: user.id });
    })
    .then((userMachines) => {
      _.remove(userMachines, (machine) => machine.users.length === 0);
      if (!userMachines.length) {
        return new Promise((resolve, reject) => {
          Promise.props({
            machines: Machine.find({ image: image.id }).populate('users'),
            config: ConfigService.get('UserPerMachines', 'ldapActivated')
          })
            .then(({machines, config}) => {
              _.remove(machines, (machine) =>
                machine.users.length >= ((config.ldapActivated) ? config.UserPerMachines : 1));

              // Order machines by number of users to assign the user to a machine already assigned.
              machines = _.sortBy(machines, (machine) => { return machine.users.length; });
              _.reverse(machines);

              if (machines.length) {
                if (_.findIndex(machines, {status: 'running'}) !== -1) {
                  let row = _.findIndex(machines, {status: 'running'});
                  machines[row].user = user.id;
                  _createBrokerLog(machines[row], 'Assigned')
                    .then(() => {
                      return UserMachine.create({
                        user: user.id,
                        machine: machines[row].id
                      });
                    })
                    .then(() => {
                      updateMachinesPool();
                      delete machines[row].users;
                      return resolve(machines[row]);
                    });
                } else if (_.findIndex(machines, {status: 'booting'}) !== -1) {
                  let row = _.findIndex(machines, {status: 'booting'});
                  machines[row].user = user.id;
                  _createBrokerLog(machines[row], 'Assigned')
                    .then(() => {
                      return increaseMachineEndDate(machines[row]);
                    })
                    .then(() => {
                      return UserMachine.create({
                        user: user.id,
                        machine: machines[row].id
                      });
                    })
                    .then(() => {
                      updateMachinesPool();
                      return reject(`A machine have been assigned to you, it will be available shortly.`);
                    });
                }
            } else {
              return Promise.reject('A machine is booting for you. Please retry in one minute.');
            }
          });
        });
      } else {
        return ConfigService.get('neverTerminateMachine')
          .then((config) => {
            if (config.neverTerminateMachine) {
              if (userMachines[0].status === 'stopped') {
                startMachine(userMachines[0]);
                return Promise.reject('Your machine is starting. Please retry in one minute.');
              } else if (userMachines[0].status === 'running') {
                delete userMachines[0].users;
                return Promise.resolve(userMachines[0]);
              } else {
                return Promise.reject(`Your machine is ${userMachines[0].status}. Please retry in one minute.`);
              }
            } else if (userMachines[0].status === 'booting') {
              return Promise.reject(`A machine have been assigned to you, it will be available shortly.`);
            } else {
              delete userMachines[0].users;
              return Promise.resolve(userMachines[0]);
            }
          });
      }
    });
}

/**
 * Return the name of the underlying iaas driver.
 *
 * @method driverName
 * @return {String}
 */
function driverName() {
  return _driver.name();
}

/**
 * Check if the driver support session duration.
 * Manual driver don't support it.
 *
 * @method isSessionDurationSupported
 * @return {Boolean}
 */
function isSessionDurationSupported() {
  return driverName() !== 'manual';
}

/**
 * Set the user's machine endDate to now + `ConfigService:sessionDuration`
 *
 * @method increaseMachineEndDate
 * @param {Machine} machine The machine to update
 * @return {Promise}
 */
function increaseMachineEndDate(machine) {

  if (isSessionDurationSupported()) {
    return ConfigService.get('sessionDuration')
      .then((config) => {
        return machine.setEndDate(config.sessionDuration)
          .then(() => {
            setTimeout(() => {
              _shouldTerminateMachine(machine);
            }, config.sessionDuration * 1000);
          });
      });
  } else {
    return Promise.resolve();
  }
}

/**
 * Ask the underlying driver to create a new machine. It uses the
 * `ConfigService` variable:
 *  - machinesName: the name of the machine to be created
 * If ldap is activated the machine join the domain and change his name with a reboot
 *
 * @method _createMachine
 * @param image {Object[Image]} image to build the machine from
 * @private
 * @return {Promise}
 */
function _createMachine(image) {

  return ConfigService.get('machinesName')
    .then((config) => {
      return _driver.createMachine({
        name: config.machinesName
      }, image);
    })
    .then((machine) => {

      machine.status = 'booting';
      machine.image = image.id;
      _createBrokerLog(machine, 'Created');
      return Machine.create(machine);
    })
    .then((machine) => {

      return promisePoller({
        taskFn: () => {
          return machine.refresh()
            .then((machine) => {

              if (machine.status === 'running') {
                return Promise.resolve(machine);
              } else {
                return Promise.reject(machine);
              }
            });
        },
        interval: 5000,
        retries: 240 // Waiting 20 minutes maximum before considering that the machine have a problem
      })
        .catch((errs) => { // If timeout is reached

          let machine = errs.pop(); // On timeout, promisePoller rejects with an array of all rejected promises. In our case, MachineService rejects the still booting machine. Let's pick the last one.

          _createBrokerLog(machine, 'Machine take to many time to boot.');
          _terminateMachine(machine);
          throw machine;
        });
    })
    .then((machine) => {
      return Promise.props({
        password: machine.getPassword(),
        config: ConfigService.get('ldapActivated')
      })
        .then(({password, config}) => {
          machine.password = password;
          // If machine have been assigned when booting we have to keep endDate and user
          delete machine.endDate;
          delete machine.users;
          if (config.ldapActivated === true) {
            machine.status = 'booting';
          } else {
            _createBrokerLog(machine, 'Available');
            machine.killSession();
          }
          return Machine.update({id: machine.id}, machine);
        });
    })
    .then((machines) => {
      return ConfigService.get(
        'ldapActivated',
        'ldapConnectLogin',
        'ldapConnectPassword',
        'ldapDomain',
        'ldapDns',
        'ldapGroup'
      )
        .then((config) => {
          if (config.ldapActivated === true) {
            let newName = 'NANO' + Math.random().toString(36).slice(3, 14);

            return promisePoller({
              taskFn: () => {
                return PlazaService.exec(machines[0].ip, machines[0].plazaport, {
                  command: [
                    `C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
                    `-Command`,
                    `netsh interface ipv4 add dnsserver "Ethernet" address=${config.ldapDns} index=1;
                    $ComputerName = hostname;
                    $Password = ConvertTo-SecureString -String "${config.ldapConnectPassword}" -AsPlainText -Force;
                    $Creds = New-Object -TypeName "System.Management.Automation.PSCredential" -ArgumentList "${config.ldapConnectLogin}", $Password;
                    Add-Computer -DomainName "${config.ldapDomain}" -ComputerName $ComputerName -Credential $Creds -newname "${newName}"`
                  ],
                  wait: true,
                  hideWindow: true,
                  username: machines[0].username
                })
                  .catch((err) => {
                    // Ignore the 'exit status 1' error, the script was successfully executed.
                    return Promise.resolve(err);
                  });
              },
              interval: 3000,
              timeout: 3000,
              retries: 20
            })
              .then(() => {
                return rebootMachine(machines[0]);
              })
              .then((rebootedMachine) => {
                return promisePoller({
                  taskFn: () => {
                    return PlazaService.exec(rebootedMachine.ip, rebootedMachine.plazaport, {
                      command: [
                        `C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
                        `-Command`,
                        `Net LocalGroup "Remote Desktop Users" ${config.ldapDomain}\\${config.ldapGroup} /ADD`
                      ],
                      wait: true,
                      hideWindow: true,
                      username: rebootedMachine.username
                    })
                      .catch(() => {
                        // Ignore the 'exit status 1' error, the script was successfully executed.
                        return Promise.resolve(rebootedMachine);
                      });
                  },
                  interval: 3000,
                  timeout: 3000,
                  retries: 20
                });
              })
              .then((machineWithGroup) => {
                _createBrokerLog(machineWithGroup, 'Available');
                return machineWithGroup.killSession();
              });
          }
        });
    })
    .catch((errs) => {
      return (errs);
    });
}

/**
 * Ask the driver to start the specified machine
 *
 * @method startMachine
 * @public
 * @return {Promise[Machine]}
 */
function startMachine(machine) {

  if (_driver.startMachine) {
    return _driver.startMachine(machine)
      .then((machineStarting) => {
        machineStarting.status = 'starting';

        delete machine.users;
        return Machine.update({
          id: machineStarting.id
        }, machineStarting);
      })
      .then((machines) => {
        return promisePoller({
          taskFn: () => {
            return machines[0].refresh()
              .then((machineRefreshed) => {
                if (machineRefreshed.status === 'running') {
                  return Promise.resolve(machineRefreshed);
                } else {
                  return Promise.reject(machineRefreshed);
                }
              });
          },
          interval: 5000,
          retries: 100
        })
          .catch((errs) => { // If timeout is reached

            let machine = errs.pop(); // On timeout, promisePoller rejects with an array of all rejected promises. In our case, MachineService rejects the still booting machine. Let's pick the last one.

            _createBrokerLog(machine, 'Error waiting to start machine');
            _terminateMachine(machine);
            throw machine;
          });
      })
      .then((machineStarted) => {
        _createBrokerLog(machineStarted, 'Started');
        delete machineStarted.users;
        return Promise.props({
          machines: Machine.update({
            id: machine.id
          }, machineStarted),
          machineUsers: UserMachine.find({
            machine: machine.id
          })
        });
      })
      .then(({machines, machineUsers}) => {
        if (machineUsers.length) {
          increaseMachineEndDate(machines[0]);
        }
        return Machine.findOne({ id: machines[0].id }).populate('users');
      })
      .then((machine) => {
        return (machine);
      });
  } else {
    return new Promise((resolve, reject) => {
      return reject('Start machine feature is not available on this driver');
    });
  }
}

/**
 * Ask the driver to stop the specified machine
 *
 * @method stopMachine
 * @public
 * @return {Promise[Machine]}
 */
function stopMachine(machine) {

  if (_driver.stopMachine) {
    return _driver.stopMachine(machine)
      .then(() => {
        machine.status = 'stopping';
        delete machine.users;
        return Machine.update({
          id: machine.id
        }, machine);
      })
      .then((machines) => {
        return promisePoller({
          taskFn: () => {
            return machines[0].refresh()
              .then((machineRefreshed) => {

                if (machineRefreshed.status === 'stopped') {
                  return Promise.resolve(machineRefreshed);
                } else {
                  return Promise.reject(machineRefreshed);
                }
              });
          },
          interval: 5000,
          retries: 100
        })
          .catch((errs) => { // If timeout is reached

            let machine = errs.pop(); // On timeout, promisePoller rejects with an array of all rejected promises. In our case, MachineService rejects the still booting machine. Let's pick the last one.

            _createBrokerLog(machine, 'Error waiting to stop machine');
            _terminateMachine(machine);
            throw machine;
          });
      })
      .then((machineStopped) => {
        _createBrokerLog(machineStopped, 'Stopped');
        delete machineStopped.users;
        return Promise.props({
          machines: Machine.update({
            id: machine.id
          }, machineStopped),
          machineUsers: UserMachine.find({
            machine: machine.id
          })
        });
      })
      .then(({machines, machineUsers}) => {
        if (!machineUsers.length) {
          updateMachinesPool();
        }
        return Machine.findOne({ id: machines[0].id }).populate('users');
      })
      .then((machine) => {
        return (machine);
      });
  } else {
    return new Promise((resolve, reject) => {
      return reject('Stop machine feature is not available on this driver');
    });
  }
}

function _terminateMachine(machine) {

  if (_driver.destroyMachine) {
    return _driver.destroyMachine(machine)
      .then(() => {
        return Machine.destroy({
          id: machine.id
        });
      })
      .then(() => {
        return _createBrokerLog(machine, 'Deleted');
      });
  }
}

/**
 * Create new machines if needed in the pool. It uses the `ConfigService`
 *
 * @method updateMachinesPool
 * @public
 * @return {Promise}
 */
function updateMachinesPool() {

  return assert(!!_driver, driverNotInitializedError)
    .then(() => {

      return Promise.props({
        config: ConfigService.get('machinePoolSize'),
        machinesCount: Promise.promisify(Machine.query)({
          text: 'SELECT image, COUNT(image) FROM machine WHERE (SELECT COUNT(usermachine.user) FROM usermachine WHERE "machine" = machine.id) = 0 GROUP BY "machine"."image"',
          values: []
        }),
        machines: Machine.find().populate('users'),
        images: Image.find(),
      })
        .then(({config, machinesCount, machines, images}) => {
          _.remove(machines, (machine) => machine.users.length !== 0);

          let imagesDeleted = _.remove(images, (image) => image.deleted === true);
          images.forEach((image) => {
            let machineCreated = _.find(machinesCount.rows, (m) => m.image === image.id) || {count: 0};
            let machinePoolSize = (image.poolSize !== null) ? image.poolSize : config.machinePoolSize;
            let machineToRecreate = _.filter(machines, (m) => {
              return m.image === image.id && m.flavor !== _driver.instancesSize(image.instancesSize);
            }).length;
            let machineToCreate = machinePoolSize - machineCreated.count;
            let machineToDestroy = machineCreated.count - machinePoolSize;

            if (machineToDestroy > 0) {
              return Machine.find({
                image: image.id,
              })
                .populate('users')
                .then((machines) => {
                  _.remove(machines, (machine) => machine.users.length >= 1);
                  _.times(machineToDestroy, (index) => _terminateMachine(machines[index]));
                  _createBrokerLog({
                    type: _driver.name()
                  }, `Update machine pool for image ${image.name} from ${machineCreated.count} to ${+machineCreated.count - machineToDestroy} (-${machineToDestroy})`);
                });
            } else if (machineToCreate > 0) {
              _.times(machineToCreate, () => _createMachine(image));
              _createBrokerLog({
                type: _driver.name()
              }, `Update machine pool for image ${image.name} from ${machineCreated.count} to ${+machineCreated.count + machineToCreate} (+${machineToCreate})`);
            } else if (machineToRecreate > 0) {
              return Machine.find({
                image: image.id,
                or: [{
                  flavor: null
                }, {
                  flavor: {
                    '!': _driver.instancesSize(image.instancesSize)
                  }
                }]
              })
                .populate('users')
                .then((machinesWithWrongSize) => {
                  _.remove(machinesWithWrongSize, (machine) => machine.users.length);
                  _.times(machineToRecreate, (index) => {
                    _terminateMachine(machinesWithWrongSize[index]);
                    _createMachine(image);
                  });
                  _createBrokerLog({
                    type: _driver.name(),
                    flavor: image.instancesSize
                  }, `Update machine pool for image ${image.name} recreate ${+machineToRecreate}`);
                });
            }
          });
          imagesDeleted.forEach((image) => {
            let machineCreated = _.find(machinesCount.rows, (m) => m.image === image.id) || {count: 0};
            let machineToDestroy = machineCreated.count;
            if (machineToDestroy > 0) {
              return Machine.find({
                image: image.id,
              })
                .populate('users')
                .then((machines) => {
                  _.remove(machines, (machine) => machine.users.length);
                  _.times(machineToDestroy, (index) => _terminateMachine(machines[index]));
                  _createBrokerLog({
                    type: _driver.name()
                  }, `Update machine pool for image ${image.name} from ${machineCreated.count} to ${+machineCreated.count - machineToDestroy} (-${machineToDestroy})`);
                });
            }
          });

        })
        .then(() => {
          return _createBrokerLog({
            type: _driver.name()
          }, 'Machine pool updated');
        })
        .catch(() => {
          _createBrokerLog({
            type: _driver.name()
          }, 'Error while updating the pool');
        });
    });
}

/**
 * Check if the specified machine should be terminated and terminate it if so.
 * The machine will be terminated if the machine's endDate is in the past and if
 * the user doesn't use it.
 *
 * @method _shouldTerminateMachine
 * @private
 * @return {null}
 */
function _shouldTerminateMachine(machine) {
  Promise.props({
    isActive: machine.isSessionActive(),
    config: ConfigService.get('neverTerminateMachine'),
    machineToTerminate: Machine.findOne({id: machine.id})
  })
    .then(({isActive, config, machineToTerminate}) => {
      if (!isActive) {
        const now = new Date();
        if (machineToTerminate.endDate < now) {
          if (config.neverTerminateMachine) {
            machineToTerminate.endDate = null;

            stopMachine(machineToTerminate);
          } else {

            //            Machine.update(machineToTerminate.id, machineToTerminate)
            UserMachine.destroy({
              machine: machineToTerminate.id
            })
              .then(() => {
                _terminateMachine(machineToTerminate);
              });
          }
        }
      }
    });
  return null;
}

/**
 * Inform the broker that the user has open a session on his machine.
 * It basically just call `increaseMachineEndDate`.
 *
 * @method sessionOpen
 * @param {User} user The user that open the session
 * @param {Image} image The image machine has boot with
 * @return {Promise}
 */
function sessionOpen(user, image) {
  return getMachineForUser(user, image)
    .then((machine) => {
      machine.endDate = null;
      machine.user = user.id;
      _createBrokerLog(machine, 'Opened')
        .then(() => {
          return StorageService.findOrCreate(user)
            .then((storage) => {
              return PlazaService.exec(machine.ip, machine.plazaport, {
                command: [
                  `C:\\Windows\\System32\\net.exe`,
                  'use',
                  'z:',
                  `\\\\${storage.hostname}\\${storage.username}`,
                  `/user:${storage.username}`,
                  storage.password
                ],
                wait: true,
                hideWindow: true,
                username: machine.username
              })
                .catch(() => {
                  // User storage is probably already mounted
                  // When an image is published, sometimes storage does not work again
                  // Let's delete the currupted storage and recreate it
                  // Let's ignore the error silently

                  return PlazaService.exec(machine.ip, machine.plazaport, {
                    command: [
                      `C:\\Windows\\System32\\net.exe`,
                      'use',
                      'z:',
                      `/DELETE`,
                      `/YES`
                    ],
                    wait: true,
                    hideWindow: true,
                    username: machine.username
                  })
                    .then(() => {
                      return PlazaService.exec(machine.ip, machine.plazaport, {
                        command: [
                          `C:\\Windows\\System32\\net.exe`,
                          'use',
                          'z:',
                          `\\\\${storage.hostname}\\${storage.username}`,
                          `/user:${storage.username}`,
                          storage.password
                        ],
                        wait: true,
                        hideWindow: true,
                        username: machine.username
                      });
                    })
                    .then(() => {
                      return Promise.resolve();
                    });
                });
            })
            .then(() => {
              return PlazaService.exec(machine.ip, machine.plazaport, {
                command: [
                  `C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
                  '-Command',
                  '-'
                ],
                wait: true,
                hideWindow: true,
                username: machine.username,
                stdin: '$a = New-Object -ComObject shell.application;$a.NameSpace( "Z:\" ).self.name = "Personal Storage"'
              });
            })
            .then(() => {
              if (user.team) {
                Promise.props({
                  team: Team.findOne(user.team),
                  config: ConfigService.get('teamStorageAddress'),
                })
                  .then(({team, config}) => {

                    let command = [
                      `C:\\Windows\\System32\\net.exe`,
                      'use',
                      'y:',
                      `\\\\${config.teamStorageAddress}\\${team.username}`,
                      `/user:${team.username}`,
                      team.password
                    ];
                    return PlazaService.exec(machine.ip, machine.plazaport, {
                      command: command,
                      wait: true,
                      hideWindow: true,
                      username: machine.username
                    })
                      .catch(() => {
                        // Team storage is probably already mounted like user storage
                        // When an image is published, sometimes team storage does not work again
                        // Let's delete the currupted team storage and recreate it
                        // Let's ignore the error silently

                        return PlazaService.exec(machine.ip, machine.plazaport, {
                          command: [
                            `C:\\Windows\\System32\\net.exe`,
                            'use',
                            'y:',
                            `/DELETE`,
                            `/YES`
                          ],
                          wait: true,
                          hideWindow: true,
                          username: machine.username
                        })
                          .then(() => {
                            return PlazaService.exec(machine.ip, machine.plazaport, {
                              command: command,
                              wait: true,
                              hideWindow: true,
                              username: machine.username
                            });
                          })
                          .then(() => {
                            return Promise.resolve();
                          });
                      });
                  })
                  .then(() => {
                    return PlazaService.exec(machine.ip, machine.plazaport, {
                      command: [
                        `C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
                        '-Command',
                        '-'
                      ],
                      wait: true,
                      hideWindow: true,
                      username: machine.username,
                      stdin: '$a = New-Object -ComObject shell.application;$a.NameSpace( "Y:\" ).self.name = "Team"'
                    });
                  });
              }
            });
        })
        .finally(() => {
          return Machine.update(machine.id, machine);
        });
    });
}

/**
 * Inform if the driver used support Credit
 *
 * @method isUserCreditSupported
 * @param {}
 * @return {Boolean}
 */
function isUserCreditSupported() {
  if (_driver.name() === 'aws') {
    return true;
  } else {
    return false;
  }
}

/**
 * Inform the broker that the user's session has ended.
 * It basically just call `increaseMachineEndDate`.
 *
 * @method sessionEnded
 * @param {User} user The user that ended the session
 * @param {Image} image The image used to boot user's machine
 * @return {Promise}
 */
function sessionEnded(user, image) {

  let promise = getMachineForUser(user, image)
    .then((userMachine) => {
      userMachine.user = user.id;
      return _createBrokerLog(userMachine, 'Closed')
        .then(() => {
          return increaseMachineEndDate(userMachine);
        });
    });

  if (isUserCreditSupported()) {
    promise.then(() => {
      return _driver.getUserCredit(user)
        .then((creditUsed) => {
          return User.update({
            id: user.id
          }, {
            credit: creditUsed
          });
        });
    });
  }

  return promise;
}

/**
 * Return the list of machines with the status attribute up to date.
 *
 * @method machines
 * @return {Promise[[]Object]}
 */
function machines() {
  return Machine.find({
    type: _driver.name()
  })
    .then((machines) => {
      machines = machines.map((machine) => {
        machine = machine.toObject();
        return _driver.getServer(machine.id)
          .then((server) => {
            machine.status = server.status;
            return machine;
          });
      });
      return Promise.all(machines);
    });
}

/*
 * Create an image from a machine
 * The image will be used as default image for future execution servers
 *
 * @method createImage
 * @param {Object} Image object with `buildFrom` attribute set to the machine id to create image from
 * @return {Promise[Image]} resolves to the created image
 */
function createImage(image) {

  let newImage = null;

  return Machine.findOne(image.buildFrom)
    .then((machine) => {
      return Image.findOne(machine.image)
        .populate('apps');
    })
    .then((oldImage) => {
      return _driver.createImage(image)
        .then((image) => {
          return Image.create(image);
        })
        .then((image) => {
          newImage = image;
          let promises = [];

          oldImage.apps.forEach((app) => {
            if (app.alias !== 'Desktop') {
              promises.push(App.create({
                alias: app.alias,
                displayName: app.displayName,
                filePath: app.filePath,
                image: newImage.id
              }));
            }
          });

          return Promise.all(promises);
        })
          .then(() => {
            updateMachinesPool();
            return Promise.resolve(newImage);
          });
    });
}

/*
 * Delete an image
 *
 * @method deleteImage
 * @param {Object} Image object
 * @return {Promise[Image]} resolves to the deleted image
 */
function deleteImage(image) {
  return _driver.deleteImage(image)
    .catch((err) => {
      /**
       * If the method is not implemented on the driver, it's not an
       * error du to the driver, so we ignore this error silently
       */
      if (err.message === 'Driver\'s method "deleteImage" not implemented') {
        return Promise.resolve(image);
      }
      return Promise.reject(err);
    });
}

/*
 * Create a new broker log
 *
 * @method _createBrokerLog
 * @param {Machine} the machine to log
 * @param {string} the state to save (created, deleted, opened, ...)
 * @return {Promise} created log
 */
function _createBrokerLog(machine, state) {
  return Machine.count({
    status: 'running'
  })
    .then((nbrMachines) => {
      return BrokerLog.create({
        userId: (machine.user) ? machine.user : null,
        machineId: machine.id,
        machineDriver: machine.type,
        machineFlavor: machine.flavor,
        state: state,
        poolSize: nbrMachines
      });
    });
}

/**
 * Retrieve the machine's data
 *
 * @method refresh
 * @param {machine} Machine model
 * @return {Promise[Machine]}
 */
function refresh(machine) {
  return _driver.refresh(machine);
}

/**
 * Retrieve the machine's password
 *
 * @method getPassword
 * @param {machine} Machine model
 * @return {Promise[String]}
 */
function getPassword(machine) {
  return _driver.getPassword(machine);
}

/**
 * Reboot the machine
 *
 * @method rebootMachine
 * @param string Id of the machine
 * @return {Promise[Object]}
 */
function rebootMachine(machine) {
  return _driver.rebootMachine(machine)
    .then(() => {
      return Machine.update({
        id: machine.id
      }, {
        status: 'booting'
      });
    })
    .then((machines) => {
      let updatedMachine = machines[0];
      let requestOptions = {
        url: 'http://' + updatedMachine.ip + ':' + updatedMachine.plazaport,
        method: 'GET'
      };
      return new Promise((resolve) => {
        setTimeout(() => {
          return promisePoller({
            taskFn: () => {
              return request(requestOptions)
                .then(() => {
                  return resolve(updatedMachine);
                })
                .catch(() => {
                  return Promise.reject(updatedMachine);
                });
            },
            interval: 5000,
            retries: 100
          })
            .catch((errs) => { // If timeout is reached

              let machine = errs.pop(); // On timeout, promisePoller rejects with an array of all rejected promises. In our case, MachineService rejects the still booting machine. Let's pick the last one.

              _createBrokerLog(machine, `Error rebooting machine ${machine.id}`);
              _terminateMachine(machine);
              throw machine;
            });
        }, 10000);
      });
    })
    .then((updatedMachine) => {
      _createBrokerLog(updatedMachine, `Machine rebooted`);
      return Machine.update({
        id: updatedMachine.id
      }, {status: 'running'})
        .then((machines) => {
          return machines[0];
        });
    });
}

module.exports = {
  initialize, getMachineForUser, driverName, sessionOpen, sessionEnded,
  machines, createImage, refresh, getPassword, rebootMachine, startMachine,
  stopMachine, updateMachinesPool, deleteImage
};
