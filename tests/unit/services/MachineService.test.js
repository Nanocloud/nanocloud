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
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

/* global Image, MachineService, Machine, ConfigService, BrokerLog, User */

const adminId = 'aff17b8b-bf91-40bf-ace6-6dfc985680bb';
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const request = require('request-promise');
const Promise = require('bluebird');
const _ = require('lodash');

describe('Machine Service', () => {

  var imageId;

  before('Disable ldap', (done) => {
    ConfigService.set('ldapActivated', false)
      .then(() => {
        return done();
      });
  });

  describe('Broker', () => {

    before('Force machine to terminate if no one is connected', function(done) {

      ConfigService.set('sessionDuration', 0)
        .then(() => {
          return Machine.destroy();
        })
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return BrokerLog.destroy();
        })
        .then(() => {
          setTimeout(() => {
            return done();
          }, 200);
        });
    });

    it('Should provision new machine when one is affected to a user', (done) => {
      Promise.props({
        conf: ConfigService.get('machinePoolSize'),
        images: Image.find({
          deleted: false
        }),
        machines: Machine.find().populate('users')
      })
        .then(({conf, images, machines}) => {
          _.remove(machines, (machine) => machine.users.length >= 1);
          if (machines.length !== conf.machinePoolSize * images.length) {
            throw new Error('Available machines should be equal to machine pool size');
          }

          return MachineService.getMachineForUser({
            id: adminId,
          }, {
            id: images[0].id
          })
            .then(() => {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  Machine.count()
                    .then((machineNbr) => {

                      if (machineNbr !== conf.machinePoolSize * images.length + 1) {
                        return reject('A new machine should be created');
                      }

                      return resolve();
                    });
                }, 150);
              });
            })
            .then(() => {
              return Machine.find().populate('users');
            })
            .then((machines) => {
              let machineNbr = 0;
              _.remove(machines, (machine) => machine.users.length >= 1);
              machineNbr = machines.length;
              if (machineNbr !== conf.machinePoolSize * images.length) {
                throw new Error('One machine should belongs to the admin');
              }
              return new Promise((resolve) => {
                return setTimeout(function() {
                  return BrokerLog.find({
                    userId: adminId,
                    state: 'Assigned',
                  })
                    .then((log) => {
                      return resolve(log);
                    });
                }, 150);
              });
            })
            .then((logs) => {
              if (logs.length !== 1) {
                throw new Error('Broker should log when a machine is assigned');
              }
              assert.equal(logs[0].userId, adminId);
              assert.isNotNull(logs[0].machineId);
              assert.equal(logs[0].state, 'Assigned');
              assert.equal(logs[0].machineDriver, 'dummy');
              assert.equal(logs[0].machineFlavor, 'medium');
              return new Promise((resolve) => {
                return setTimeout(function() {
                  return BrokerLog.find({
                    machineId: {
                      '!': logs[0].machineId,
                    },
                    state: 'Created'
                  })
                    .then((log) => {
                      return resolve(log);
                    });
                }, 200);
              });
            })
            .then((machineLogs) => {
              if (machineLogs.length !== 1) {
                throw new Error('Broker should log when a machine is created');
              }
              assert.isNotNull(machineLogs[0].machineId);
              assert.equal(machineLogs[0].state, 'Created');
              assert.equal(machineLogs[0].machineDriver, 'dummy');
              assert.equal(machineLogs[0].machineFlavor, 'medium');
              return new Promise((resolve) => {
                return setTimeout(function() {
                  return BrokerLog.find({
                    userId: null,
                    state: {
                      like: '%Update machine pool%'
                    }
                  })
                    .then((log) => {
                      return resolve(log);
                    });
                }, 150);
              });
            })
            .then((logs) => {
              if (logs.length !== 1) {
                throw new Error('Broker should log when machine pool need to be update');
              }
              assert.isNull(logs[0].machineId);
              assert.equal(logs[0].state, 'Update machine pool for image Default from 0 to 1 (+1)');
              assert.equal(logs[0].machineDriver, 'dummy');
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Should return the same machine for a user', (done) => {
      Machine.find().populate('users', { id: adminId })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length === 0);

          const userMachine = machines[0].id;
          const machineImage = machines[0].image;


          MachineService.getMachineForUser({
            id: adminId,
            name: 'Admin'
          }, {
            id: machineImage
          })
            .then((res) => {
              assert.equal(res.id, userMachine);
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Should return an inactive session', (done) => {
      Machine.find().populate('users', {
        id: adminId
      })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length === 0);
          return machines[0].getSessions();
        })
        .then((sessions) => {
          assert.equal(sessions.length, 1);
          assert.equal(sessions[0].state, 'Inactive');
          return done();
        });
    });

    it('Opening a session should considere it as active', (done) => {
      Promise.props({
        machines: Machine.find().populate('users', {
          id: adminId
        }),
        user: User.findOne({id: adminId})
      })
        .then(({machines, user}) => {
          _.remove(machines, (machine) => machine.users.length === 0);
          return MachineService.sessionOpen(user, {
            id: machines[0].image
          });
        })
        .then(() => {
          return Machine.find().populate('users', {
            id: adminId
          })
            .then((machines) => {
              let machine = null;
              _.remove(machines, (machine) => machine.users.length === 0);
              machine = machines[0];

              return request('http://' + machine.ip + ':' + machine.plazaport + '/sessionOpen')
                .then(() => {
                  return machine.isSessionActive();
                })
                .then((active) => {
                  assert.isTrue(active);
                  return new Promise((resolve) => {
                    return setTimeout(function() {
                      return BrokerLog.find({
                        userId: adminId,
                        state: 'Opened'
                      })
                        .then((log) => {
                          return resolve(log);
                        });
                    }, 150);
                  });
                })
                .then((logs) => {
                  if (!logs.length) {
                    throw new Error('Broker should log when a sessions is opened');
                  }
                  assert.equal(logs[0].userId, adminId);
                  assert.isNotNull(logs[0].machineId);
                  assert.equal(logs[0].state, 'Opened');
                  assert.equal(logs[0].machineDriver, 'dummy');
                  assert.equal(logs[0].machineFlavor, 'medium');
                  return done();
                });
            });
        });
    });

    it('Should return an active session', (done) => {
      Machine.find().populate('users', {
        id: adminId
      })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length === 0);
          return machines[0].getSessions();
        })
        .then((sessions) => {
          assert.equal(sessions.length, 1);
          assert.equal(sessions[0].state, 'Active');
          return done();
        });
    });

    it('Should end the active session', (done) => {
      Machine.find().populate('users', {
        id: adminId
      })
        .then((machines) => {
          let machine = _.find(machines, (machine) => machine.users.length >= 1);
          return machine.killSession()
            .then(() => {
              return machine.isSessionActive();
            })
            .then((active) => {
              assert.isFalse(active);
              return done();
            });
        });
    });

    it('Should stop machine', (done) => {
      return Machine.find().populate('users', {
        id: adminId
      })
        .then((machines) => {
          let machine = _.find(machines, (machine) => machine.users.length >= 1);
          return MachineService.stopMachine({ id: machine.id })
            .then((machineStopped) => {
              assert.equal(machineStopped.id, machine.id);
              assert.equal(machineStopped.users[0].id, machine.users[0].id);
              assert.equal(machineStopped.status, 'stopped');
              return;
            })
            .then(() => {
              return new Promise((resolve) => {
                return setTimeout(function() {
                  return BrokerLog.findOne({
                    machineId: machine.id,
                    state: 'Stopped'
                  })
                    .then((log) => {
                      return resolve(log);
                    });
                }, 150); // give broker time to log the machine state
              });
            })
            .then((log) => {
              assert.equal(log.state, 'Stopped');
              assert.equal(log.machineId, machine.id);
              return;
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Should start machine', (done) => {
      return Machine.find().populate('users', {
        id: adminId
      })
        .then((machines) => {
          let machine = _.find(machines, (machine) => machine.users.length >= 1);
          return MachineService.startMachine({ id: machine.id })
            .then((machineStarted) => {
              assert.equal(machineStarted.id, machine.id);
              assert.equal(machineStarted.users[0].id, machine.users[0].id);
              assert.equal(machineStarted.status, 'running');
              return;
            })
            .then(() => {
              return new Promise((resolve) => {
                return setTimeout(function() {
                  return BrokerLog.findOne({
                    machineId: machine.id,
                    state: 'Started'
                  })
                    .then((log) => {
                      return resolve(log);
                    });
                }, 150);
              });
            })
            .then((log) => {
              assert.equal(log.state, 'Started');
              assert.equal(log.machineId, machine.id);
              return;
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Should terminate machine if no connection occured after the maximum session duration time', (done) => {
      return Image.findOne({
        name: 'Default'
      })
        .then((image) => {
          return MachineService.getMachineForUser({
            id: adminId
          }, image)
            .then((machine) => {
              return request('http://' + machine.ip + ':' + machine.plazaport + '/sessionClose')
                .then(() => {
                  return MachineService.sessionEnded({
                    id: adminId
                  }, image);
                })
                .then(() => {
                  return Machine.find({
                    image: image.id
                  }).populate('users', { id: adminId });
                })
                .then((userMachines) => {
                  let userMachine = null;
                  _.remove(userMachines, (machine) => machine.users.length === 0);
                  userMachine = userMachines[0];
                  assert.isNotNull(userMachine.endDate);
                  return BrokerLog.find({
                    userId: adminId,
                    state: 'Closed'
                  });
                })
                .then((logs) => {
                  if (!logs.length || !logs[0].machineId.length) {
                    throw new Error('Broker should log when a session ended');
                  }
                  assert.equal(logs[0].userId, adminId);
                  assert.isNotNull(logs[0].machineId);
                  assert.equal(logs[0].state, 'Closed');
                  assert.equal(logs[0].machineDriver, 'dummy');
                  assert.equal(logs[0].machineFlavor, 'medium');
                  setTimeout(() => {
                    return Machine.findOne({
                      id: machine.id
                    })
                      .then((res) => {
                        assert.isUndefined(res);
                      })
                      .then(() => {
                        return Machine.find().populate('users');
                      })
                      .then((machines) => {
                        _.remove(machines, (machine) => machine.users.length >= 1);
                        assert.equal(machines.length, 1);
                        assert.equal(machines[0].users.length, 0);
                        return BrokerLog.find({
                          state: 'Deleted'
                        });
                      })
                      .then((logs) => {
                        if (!logs.length || !logs[0].machineId.length) {
                          throw new Error('Broker should log when a machine is terminated');
                        }
                        assert.isNotNull(logs[0].machineId);
                        assert.equal(logs[0].state, 'Deleted');
                        assert.equal(logs[0].machineDriver, 'dummy');
                        assert.equal(logs[0].machineFlavor, 'medium');
                        return done();
                      });
                  }, 150); // Give broker time to cleanup instances
                });
            });
        });
    });
  });

  describe('Images', function() {

    before('Create images', function(done) {

      return Machine.find()
        .then((machines) => {
          return MachineService.createImage({
            buildFrom: machines[0].id,
            name: 'New image'
          });
        })
        .then(() => {
          return Machine.destroy();
        })
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return done();
        });

    });

    after('Destroy images', function(done) {

      Image.findOne({
        name: 'New image'
      })
        .then((image) => {
          return Machine.destroy({
            image: image.id
          });
        })
        .then((machine) => {
          return Image.destroy({
            id: machine.image
          });
        })
        .then(() => {
          return done();
        });
    });

    it('Should exist as much VM in the pool as there are images', function(done) {
      MachineService.updateMachinesPool()
        .then(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              return resolve(Machine.find().populate('users'));
            }, 100);
          });
        })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length >= 1);
          expect(machines).to.have.length(2);
        })
        .then(() => {
          return done();
        });
    });
  });

  describe('Broker with the option forcing it to always assign the same machine to a user', () => {

    before('Force machine to stop if no one is connected, and enable the neverTerminateMachine option', function(done) {

      ConfigService.set('sessionDuration', 0)
        .then(() => {
          return ConfigService.set('neverTerminateMachine', true);
        })
        .then(() => {
          return done();
        });
    });

    after('stop forcing broker to always assign the same machine to a user', () => {
      ConfigService.set('neverTerminateMachine', false);
    });

    it('Should provision new machine when one is affected to a user', (done) => {
      MachineService.updateMachinesPool()
        .then(() => {
          return Promise.props({
            conf: ConfigService.get('machinePoolSize'),
            images: Image.find({
              deleted: false
            }),
            machines: Machine.find().populate('users')
          });
        })
        .then(({conf, images, machines}) => {
          _.remove(machines, (machine) => machine.users.length >= 1);
          var machineId = null;
          imageId = _.find(images, { deleted: false, name: 'Default'}).id;
          if (machines.length !== conf.machinePoolSize * images.length) {
            throw new Error('Available machines should be equal to machine pool size');
          }

          return MachineService.getMachineForUser({
            id: adminId,
          }, {
            id: imageId
          })
            .then((machine) => {
              machineId = machine.id;
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  Machine.count()
                    .then((machineNbr) => {

                      if (machineNbr !== conf.machinePoolSize * images.length + 1) {
                        return reject('A new machine should be created');
                      }

                      return resolve();
                    });
                }, 150);
              });
            })
            .then(() => {
              return Machine.find().populate('users');
            })
            .then((machines) => {
              _.remove(machines, (machine) => machine.users.length >= 1);
              if (machines.length !== conf.machinePoolSize * images.length) {
                throw new Error('One machine should belongs to the admin');
              }
              return new Promise((resolve) => {
                return setTimeout(function() {
                  return BrokerLog.find({
                    userId: adminId,
                    state: 'Assigned',
                    machineId: machineId
                  })
                    .then((log) => {
                      return resolve(log);
                    });
                }, 150);
              });
            })
            .then((logs) => {
              if (logs.length !== 1) {
                throw new Error('Broker should log when a machine is assigned');
              }
              assert.equal(logs[0].userId, adminId);
              assert.isNotNull(logs[0].machineId);
              assert.equal(logs[0].state, 'Assigned');
              assert.equal(logs[0].machineDriver, 'dummy');
              assert.equal(logs[0].machineFlavor, 'medium');
              return new Promise((resolve) => {
                return setTimeout(function() {
                  return BrokerLog.find({
                    machineId: logs[0].machineId,
                    state: 'Created'
                  })
                    .then((log) => {
                      return resolve(log);
                    });
                }, 150);
              });
            })
            .then((machineLogs) => {
              if (machineLogs.length !== 1) {
                throw new Error('Broker should log when a machine is created');
              }
              assert.isNotNull(machineLogs[0].machineId);
              assert.equal(machineLogs[0].state, 'Created');
              assert.equal(machineLogs[0].machineDriver, 'dummy');
              assert.equal(machineLogs[0].machineFlavor, 'medium');
              return new Promise((resolve) => {
                return setTimeout(function() {
                  return BrokerLog.find({
                    userId: null,
                    state: {
                      like: '%Update machine pool for image Default%'
                    }
                  })
                    .then((log) => {
                      return resolve(log);
                    });
                }, 150);
              });
            })
            .then((logs) => {
              if (logs.length !== 4) {
                throw new Error('Broker should log when machine pool need to be update');
              }
              assert.isNull(logs[0].machineId);
              assert.equal(logs[0].state, 'Update machine pool for image Default from 0 to 1 (+1)');
              assert.equal(logs[0].machineDriver, 'dummy');
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Should return the same machine for a user', (done) => {
      MachineService.getMachineForUser({
        id: adminId,
      }, {
        id: imageId
      })
        .then((res) => {

          const userMachine = res.id;

          MachineService.getMachineForUser({
            id: adminId,
          }, {
            id: imageId
          })
            .then((res) => {
              assert.equal(res.id, userMachine);
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Should adapt machines pool size', (done) => {
      Image.update({
        id: imageId
      }, {
        poolSize: 2,
      })
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return Machine.find({
            image: imageId,
          }).populate('users');
        })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length >= 1);
          expect(machines).to.have.length(2);
          return Machine.find().populate('users');
        })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length >= 1);
          // Default pool size 1, and we set *imageId* pool size to 2. So it must be 3 running machines in pool
          expect(machines).to.have.length(3);

          return Image.update({
            id: imageId
          }, {
            poolSize: null,
          });
        })
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              return resolve(Machine.find().populate('users'));
            }, 100);
          });
        })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length >= 1);
          expect(machines).to.have.length(2);
          return done();
        });
    });

    it('Should return an inactive session', (done) => {
      MachineService.getMachineForUser({
        id: adminId,
      }, {
        id: imageId
      })
        .then((machine) => {
          return machine.getSessions();
        })
        .then((sessions) => {
          assert.equal(sessions.length, 1);
          assert.equal(sessions[0].state, 'Inactive');
          return done();
        });
    });

    it('Opening a session should considere it as active', (done) => {
      User.findOne({id: adminId})
        .then((user) => {
          return MachineService.sessionOpen(user, {
            id: imageId
          });
        })
        .then(() => {
          return MachineService.getMachineForUser({
            id: adminId,
          }, {
            id: imageId
          })
            .then((machine) => {
              return request('http://' + machine.ip + ':' + machine.plazaport + '/sessionOpen')
                .then(() => {
                  return machine.isSessionActive();
                })
                .then((active) => {
                  assert.isTrue(active);
                  return new Promise((resolve) => {
                    return setTimeout(function() {
                      return BrokerLog.find({
                        userId: adminId,
                        state: 'Opened'
                      })
                        .then((log) => {
                          return resolve(log);
                        });
                    }, 150);
                  });
                })
                .then((logs) => {
                  if (!logs.length) {
                    throw new Error('Broker should log when a sessions is opened');
                  }
                  assert.equal(logs[0].userId, adminId);
                  assert.isNotNull(logs[0].machineId);
                  assert.equal(logs[0].state, 'Opened');
                  assert.equal(logs[0].machineDriver, 'dummy');
                  assert.equal(logs[0].machineFlavor, 'medium');
                  return done();
                });
            });
        });
    });

    it('Should return an active session', (done) => {
      MachineService.getMachineForUser({
        id: adminId,
      }, {
        id: imageId
      })
        .then((machine) => {
          return machine.getSessions();
        })
        .then((sessions) => {
          assert.equal(sessions.length, 1);
          assert.equal(sessions[0].state, 'Active');
          return done();
        });
    });

    it('Should end the active session', (done) => {
      MachineService.getMachineForUser({
        id: adminId,
      }, {
        id: imageId
      })
        .then((machine) => {
          return machine.killSession()
            .then(() => {
              return machine.isSessionActive();
            })
            .then((active) => {
              assert.isFalse(active);
              return done();
            });
        });
    });

    it('Should stop machine if no connection occured after the maximum session duration time', (done) => {
      return MachineService.getMachineForUser({
        id: adminId,
      }, {
        id: imageId
      })
        .then((machine) => {
          return request('http://' + machine.ip + ':' + machine.plazaport + '/sessionClose')
            .then(() => {
              return MachineService.sessionEnded({
                id: adminId
              }, {
                id: imageId
              });
            })
            .then(() => {
              return Machine.find().populate('users', {
                id: adminId
              });
            })
            .then((userMachines) => {
              let userMachine = null;
              _.remove(userMachines, (machine) => machine.users.length === 0);
              userMachine = userMachines[0];
              assert.isNotNull(userMachine.endDate);
              return new Promise((resolve) => {
                return setTimeout(function() {
                  return BrokerLog.find({
                    userId: adminId,
                    state: 'Closed'
                  })
                    .then((log) => {
                      return resolve(log);
                    });
                }, 150);
              });
            })
            .then((logs) => {
              if (!logs.length || !logs[0].machineId.length) {
                throw new Error('Broker should log when a session ended');
              }
              assert.equal(logs[0].userId, adminId);
              assert.isNotNull(logs[0].machineId);
              assert.equal(logs[0].state, 'Closed');
              assert.equal(logs[0].machineDriver, 'dummy');
              assert.equal(logs[0].machineFlavor, 'medium');
              setTimeout(() => {
                return Machine.findOne({
                  id: machine.id
                })
                  .then((res) => {
                    assert.isDefined(res);
                  })
                  .then(() => {
                    return Machine.find().populate('users');
                  })
                  .then((machines) => {
                    _.remove(machines, (machine) => machine.users.length >= 1);
                    assert.equal(machines.length, 2);
                    assert.equal(machines[0].users.length, 0);
                    return new Promise((resolve) => {
                      return setTimeout(function() {
                        return BrokerLog.find({
                          state: 'Stopped'
                        })
                          .then((log) => {
                            return resolve(log);
                          });
                      }, 150);
                    });
                  })
                  .then((logs) => {
                    if (!logs.length || !logs[0].machineId.length) {
                      throw new Error('Broker should log when a machine is stopped');
                    }
                    assert.isNotNull(logs[0].machineId);
                    assert.equal(logs[0].state, 'Stopped');
                    assert.equal(logs[0].machineDriver, 'dummy');
                    assert.equal(logs[0].machineFlavor, 'medium');
                    return done();
                  });
              }, 150); // Give broker time to cleanup instances
            });
        });
    });

    it('Should start the machine', (done) => {
      var machineId = null;
      return Machine.find({
        status: 'stopped'
      }).populate('users', {
        id: adminId
      })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length === 0);
          machineId = machines[0].id;
          return MachineService.getMachineForUser({
            id: adminId,
          }, {
            id: imageId
          });
        })
        .then(() => {
          throw new Error('No machine should be returned');
        })
        .catch((err) => {
          if (err !== 'Your machine is starting. Please retry in one minute.') {
            throw new Error('The wrong error have been returned');
          }
          /**
           * We set the sessionDuration to 0, and the broker set an endDate on
           * machine started again, so the machine is stopped
           */
          setTimeout(() => {
            Machine.find().populate('users', {
              id: adminId
            })
              .then((machines) => {
                let machine = _.find(machines, (machine) => machine.users.length >= 1);
                assert.equal(machine.id, machineId);
                assert.equal(machine.users[0].id, adminId);
                assert.equal(machine.status, 'stopped');
                return new Promise((resolve) => {
                  setTimeout(() => {
                    return Promise.props({
                      machines: Machine.find().populate('users', { id: adminId }),
                      log: BrokerLog.findOne({
                        state: 'Stopped',
                        machineId: machineId
                      })
                    })
                      .then((props) => {
                        _.remove(props.machines, (machine) => machine.users.length === 0);
                        props.machine = props.machines[0];
                        return resolve(props);
                      });
                  }, 150);
                });
              })
              .then((props) => {
                assert.isDefined(props.log);
                assert.isDefined(props.machine);
                assert.equal(props.machine.status, 'stopped');
                return done();
              });
          }, 150);
        });
    });
  });

  describe('Update Machine pool size', () => {

    before('Set machinePoolSize to 0', function(done) {
      return ConfigService.set('machinePoolSize', 0)
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return done();
        });
    });


    after('Set machinePoolSize to 1', function(done) {
      return ConfigService.set('machinePoolSize', 1)
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return done();
        });
    });

    it('Should add machines when machinePoolSize grow up', (done) => {
      let imageCount = 0;
      return ConfigService.set('machinePoolSize', 2)
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return Image.find({
            deleted: false
          });
        })
        .then((images) => {
          imageCount = images.length;
          return Machine.find().populate('users');
        })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length >= 1);
          if (machines.length !== 2 * imageCount) {
            throw new Error('Should have 2 running machines per images');
          }
          return ConfigService.set('machinePoolSize', 4);
        })
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(Machine.find({
                status: 'running'
              }).populate('users'));
            }, 150);
          });
        })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length >= 1);
          if (machines.length !== 4 * imageCount) {
            throw new Error('Should have 4 running machines per images');
          }
          return done();
        });
    });

    it('Should destroy not assigned running machine when machinePoolSize shrinks', (done) => {
      return ConfigService.set('machinePoolSize', 2)
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              return resolve(Promise.props({
                machines: Machine.find().populate('users'),
                images: Image.find({
                  deleted: false
                })
              }));
            }, 100);
          });
        })
        .then(({machines, images}) => {
          _.remove(machines, (machine) => machine.users.length >= 1);
          if (machines.length !== 2 * images.length) {
            throw new Error('Should still have 2 running machines per images');
          }
          return done();
        });
    });

    it('Should not destroy assigned machines when machinePoolSize shrinks', (done) => {
      return MachineService.getMachineForUser({
        id: adminId,
      }, {
        id: imageId
      })
        .then(() => {
          return ConfigService.set('machinePoolSize', 0);
        })
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return Machine.find().populate('users', {
            id: adminId
          });
        })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length === 0);
          if (machines.length !== 1) {
            throw new Error('Should have 1 assigned running machine even the machinePoolSize equal 0');
          }
          return done();
        });
    });
  });

  describe('Assign booting machine', () => {

    before('Set booting', function(done) {
      return ConfigService.set('dummyBootingState', true)
        .then(() => {
          return Machine.destroy({type: 'dummy'});
        })
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return done();
        });
    });

    after('Unset booting', function(done) {
      return ConfigService.set('dummyBootingState', false)
        .then(() => {
          return done();
        });
    });

    it('Should assign machine to user when booting', (done) => {
      return MachineService.getMachineForUser({
        id: adminId
      }, {
        id: imageId
      })
        .catch((err) => {
          if (err !== 'A machine have been assigned to you, it will be available shortly.') {
            throw new Error('Should have a comprehensive error message');
          }
        })
        .then(() => {
          return Machine.find().populate('users', { id: adminId });
        })
        .then((machines) => {
          let machine = _.find(machines, (machine) => machine.users.length === 1);
          if (machine.status !== 'booting') {
            throw new Error('Assigned machine should have been a booting machine');
          } else if (machine.enDate === null) {
            throw new Error('endDate should have been set when booting machine have been assigned');
          } else {
            return done();
          }
        });
    });
  });

  describe('Recreate machines with the wrong size', () => {

    it('Should recreate machines with the wrong size', (done) => {
      return Image.update({
        id: imageId
      }, {
        instancesSize: 'small'
      })
        .then(() => {
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return Machine.find({
            image: imageId
          }).populate('users');
        })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length === 0);
          if (_.filter(machines, (m) => m.flavor !== 'small').length > 0) {
            throw new Error('Machines should have been recreated');
          } else {
            return Image.find({
              id: {
                '!': imageId
              }
            });
          }
        })
        .then((images) => {
          return Machine.find({
            image: images[0].id,
          }).populate('users');
        })
        .then((machines) => {
          _.remove(machines, (machine) => machine.users.length === 0);
          if (_.filter(machines, (m) => m.flavor === 'small').length > 0) {
            throw new Error('Others machines should not have been recreated');
          } else {
            return done();
          }
        });
    });
  });

  describe('Assign multiple ldap users on one machine', () => {
    let user1 = null;
    let user2 = null;
    let user3 = null;
    let image = null;
    let machineAssignedId = null;

    before('Enable ldap, and set the maximum users per machines to 2', (done) => {
      return ConfigService.set('ldapActivated', true)
        .then(() => {
          return ConfigService.set('userPerMachines', 2);
        })
        .then(() => {
          return ConfigService.set('dummyBootingState', false);
        })
        .then(() => {
          return Machine.destroy();
        })
        .then(() => {
          return Image.destroy({ name: { '!': 'Default' } });
        })
        .then(() => {
          return Image.findOne({ name: 'Default', deleted: false });
        })
        .then((defaultImage) => {
          image = defaultImage;
          return MachineService.updateMachinesPool();
        })
        .then(() => {
          return User.create([{
            firstName: 'ldapUser1',
            password: 'ldapUserTest',
            email: 'user1@mail.ldap',
            isAdmin: true,
            ldapUser: true,
            ldapAccountName: 'User1',
            ldapPassword: 'ldapUserTest',
          }, {
            firstName: 'ldapUser2',
            password: 'ldapUserTest',
            email: 'user2@mail.ldap',
            isAdmin: true,
            ldapUser: true,
            ldapAccountName: 'User2',
            ldapPassword: 'ldapUserTest',
          }, {
            firstName: 'ldapUser3',
            password: 'ldapUserTest',
            email: 'user3@mail.ldap',
            isAdmin: true,
            ldapUser: true,
            ldapAccountName: 'User3',
            ldapPassword: 'ldapUserTest',
          }]);
        })
        .then((users) => {
          user1 = users[0];
          user2 = users[1];
          user3 = users[2];
          return done();
        });
    });

    after('disable ldap', (done) => {
      return ConfigService.set('ldapActivated', false)
        .then(() => {
          return done();
        });
    });

    it('Should assign maximum 2 users to one machine', (done) => {
      return MachineService.getMachineForUser(user1, image)
        .then((machine) => {
          machineAssignedId = machine.id;
          return MachineService.getMachineForUser(user2, image);
        })
        .then((machine) => {
          if (machine.id !== machineAssignedId) {
            throw new Error('Ldap users should be assigned in priority to machine already assigned');
          } else {
            return MachineService.getMachineForUser(user3, image);
          }
        })
        .then((machine) => {
          if (!machine || machine.id === machineAssignedId) {
            throw new Error('When maximum users is reached, it should assign the user to another machine');
          } else {
            return done();
          }
        });
    });

    it('Should list session with the correct user', (done) => {
      let usersMachine = null;
      return MachineService.sessionOpen(user1, image)
        .then(() => {
          return MachineService.getMachineForUser(user1, image);
        })
        .then((machine) => {
          usersMachine = machine;
          return request({
            url: 'http://' + machine.ip + ':' + machine.plazaport + '/sessionOpen',
            json: true,
            body: {
              username: user1.ldapAccountName
            },
            method: 'POST'
          });
        })
        .then(() => {
          return usersMachine.getSessions();
        })
        .then((sessions) => {
          if (sessions.length !== 1) {
            throw new Error('A session should be launched');
          } else if (sessions[0].userId !== user1.id) {
            throw new Error('The session should be launched with the correct user');
          } else {
            return request({
              url: 'http://' + usersMachine.ip + ':' + usersMachine.plazaport + '/sessionOpen',
              json: true,
              body: {
                username: user2.ldapAccountName
              },
              method: 'POST'
            });
          }
        })
        .then(() => {
          return usersMachine.getSessions();
        })
        .then((sessions) => {
          if (sessions.length !== 2) {
            throw new Error('A second session should be launched');
          } else if (sessions[1].userId !== user2.id) {
            throw new Error('The session should be launched with the correct user');
          } else {
            return done();
          }
        });
    });
  });
});
