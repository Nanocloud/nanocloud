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

/* global App, ConfigService, BrokerLog, Machine, Image, User, ConfigService, Machine, PlazaService, StorageService, Team */

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

      _initializing = ConfigService.get('iaas')
        .then((config) => {
          return Image.findOrCreate({
            buildFrom: null
          }, {
            iaasId: null,
            name: 'Default',
            buildFrom: null,
            deleted: false
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
      return Machine.findOne({
        where: {
          user: user.id,
          image: image.id
        }
      })
        .then((machine) => {
          if (!machine) {
            return new Promise((resolve, reject) => {
              Machine.query({
                text: `UPDATE machine m
            SET "user" = $1::varchar
            FROM (
              SELECT machine.id
              FROM machine
              WHERE "user" IS NULL AND ( "status" = 'running' OR "status" = 'booting' ) AND "image" = $2::varchar
              LIMIT 1
              FOR UPDATE SKIP LOCKED
            ) sub
            WHERE m.id = sub.id
            RETURNING *`,
                values: [user.id, image.id]
              }, (err, res) => {
                if (err) {
                  return reject(err);
                }

                if (res.rows.length) {
                  if (_.findIndex(res.rows, {status: 'running'}) !== -1) {
                    let row = _.findIndex(res.rows, {status: 'running'});
                    _createBrokerLog(res.rows[row], 'Assigned')
                      .then(() => {
                        updateMachinesPool();
                        return resolve(Machine.findOne({
                          id: res.rows[row].id
                        }));
                      });
                  } else if (_.findIndex(res.rows, {status: 'booting'}) !== -1) {
                    let row = _.findIndex(res.rows, {status: 'booting'});
                    _createBrokerLog(res.rows[row], 'Assigned')
                      .then(() => {
                        return Machine.findOne({
                          id: res.rows[row].id
                        })
                          .then((assignedMachine) => {
                            return increaseMachineEndDate(assignedMachine);
                          })
                          .then(() => {
                            updateMachinesPool();
                            return reject(`A machine have been assigned to you, it will be available shortly.`);
                          });
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
                  if (machine.status === 'stopped') {
                    startMachine(machine);
                    return Promise.reject('Your machine is starting. Please retry in one minute.');
                  } else if (machine.status === 'running') {
                    return Promise.resolve(machine);
                  } else {
                    return Promise.reject(`Your machine is ${machine.status}. Please retry in one minute.`);
                  }
                } else if (machine.status === 'booting') {
                  return Promise.reject(`A machine have been assigned to you, it will be available shortly.`);
                } else {
                  return Promise.resolve(machine);
                }
              });
          }
        });
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
 * Set the user's machine endDate to now + `ConfigService:sessionDuration`
 *
 * @method increaseMachineEndDate
 * @param {Machine} machine The machine to update
 * @return {Promise}
 */
function increaseMachineEndDate(machine) {

  return ConfigService.get('sessionDuration')
    .then((config) => {
      return machine.setEndDate(config.sessionDuration)
        .then(() => {
          setTimeout(() => {
            _shouldTerminateMachine(machine);
          }, config.sessionDuration * 1000);
        });
    });
}

/**
 * Ask the underlying driver to create a new machine. It uses the
 * `ConfigService` variable:
 *  - machinesName: the name of the machine to be created
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
        retries: 100
      })
        .catch((errs) => { // If timeout is reached

          let machine = errs.pop(); // On timeout, promisePoller rejects with an array of all rejected promises. In our case, MachineService rejects the still booting machine. Let's pick the last one.

          _createBrokerLog(machine, 'Error');
          _terminateMachine(machine);
          throw machine;
        });
    })
    .then((machine) => {
      return machine.getPassword()
        .then((password) => {
          machine.password = password;
          // If machine have been assigned when booting we have to keep endDate and user
          delete machine.endDate;
          delete machine.user;
          return Machine.update({id: machine.id}, machine);
        })
        .then(() => {
          _createBrokerLog(machine, 'Available');
        });
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
        return Machine.update({
          id: machine.id
        }, machineStarted);
      })
      .then((machines) => {
        if (machines[0].user) {
          increaseMachineEndDate(machines[0]);
        }
        return (machines[0]);
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
        return Machine.update({
          id: machine.id
        }, machineStopped);
      })
      .then((machines) => {
        if (!machines[0].user) {
          updateMachinesPool();
        }
        return (machines[0]);
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
 * variable:
 *  - machinePoolSize: the number of available machine to keep in the pool
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
          text: 'SELECT image, COUNT(image) FROM machine WHERE "machine"."user" IS NULL GROUP BY "machine"."image"',
          values: []
        }),
        images: Image.find()
      })
        .then(({config, machinesCount, images}) => {
          images.forEach((image) => {
            let machineCreated = _.find(machinesCount.rows, (m) => m.image === image.id) || {count: 0};
            let machineToCreate = 0;
            let machineToDestroy = 0;
            if (image.deleted === true) {
              machineToCreate = 0;
              machineToDestroy = machineCreated.count;
            } else {
              machineToCreate = config.machinePoolSize - machineCreated.count;
              machineToDestroy = machineCreated.count - config.machinePoolSize;
            }

            if (machineToDestroy > 0) {
              return Machine.find({
                image: image.id,
                user: null
              })
                .then((machines) => {
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
            machineToTerminate.user = null;

            Machine.update(machineToTerminate.id, machineToTerminate)
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
        userId: machine.user,
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
    .then((rebootedMachine) => {
      rebootedMachine.status = 'booting';
      return Machine.update({
        id: machine.id
      }, rebootedMachine);
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
  stopMachine, updateMachinesPool
};
