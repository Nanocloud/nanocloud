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

  describe('Broker', () => {

    before('Force machine to terminate if no one is connected', function(done) {

      ConfigService.set('sessionDuration', 0)
        .then(() => {
          return BrokerLog.destroy();
        })
        .then(() => {
          return Machine.destroy({
            user: {
              '!': null
            }
          });
        })
        .then(() => {
          return done();
        });
    });

    it('Should provision new machine when one is affected to a user', (done) => {
      Promise.props({
        conf: ConfigService.get('machinePoolSize'),
        images: Image.find({
          deleted: false
        }),
        machines: Machine.find({
          user: null
        })
      })
        .then(({conf, images, machines}) => {
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
                }, 100);
              });
            })
            .then(() => {
              return Machine.count({
                user: null
              });
            })
            .then((machineNbr) => {
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
                }, 100);
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
                }, 100);
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
                }, 100);
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
      Machine.findOne({
        user: adminId,
      })
        .then((res) => {

          const userMachine = res.id;
          const machineImage = res.image;

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
      Machine.findOne({
        user: adminId
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
      Promise.props({
        machine: Machine.findOne({
        user: adminId
        }),
        user: User.findOne({id: adminId})
      })
        .then(({machine, user}) => {
          return MachineService.sessionOpen(user, {
            id: machine.image
          });
        })
        .then(() => {
          return Machine.findOne({
            user: adminId
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
                    }, 100);
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
      Machine.findOne({
        user: adminId
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
      Machine.findOne({
        user: adminId
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

    it('Should stop machine', (done) => {
      return Machine.findOne({
        user: adminId
      })
        .then((machine) => {
          return MachineService.stopMachine(machine)
            .then((machineStopped) => {
              assert.equal(machineStopped.id, machine.id);
              assert.equal(machineStopped.user, machine.user);
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
                }, 100); // give broker time to log the machine state
              });
            })
            .then((log) => {
              assert.equal(log.state, 'Stopped');
              assert.equal(log.machineId, machine.id);
              assert.equal(log.userId, adminId);
              return;
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Should start machine', (done) => {
      return Machine.findOne({
        user: adminId
      })
        .then((machine) => {
          return MachineService.startMachine(machine)
            .then((machineStarted) => {
              assert.equal(machineStarted.id, machine.id);
              assert.equal(machineStarted.user, machine.user);
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
                }, 100);
              });
            })
            .then((log) => {
              assert.equal(log.state, 'Started');
              assert.equal(log.machineId, machine.id);
              assert.equal(log.userId, adminId);
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
                  return Machine.findOne({
                    user: adminId,
                    image: image.id
                  });
                })
                .then((userMachine) => {
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
                        return Machine.find({
                          user: null
                        });
                      })
                      .then((machines) => {
                        assert.equal(machines.length, 1);
                        assert.isNull(machines[0].user);
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
                  }, 100); // Give broker time to cleanup instances
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
          return Machine.find({
            user: null
          });
        })
        .then((machines) => {
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
            machines: Machine.find({
              user: null
            })
          });
        })
        .then(({conf, images, machines}) => {
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
                }, 100);
              });
            })
            .then(() => {
              return Machine.count({
                user: null
              });
            })
            .then((machineNbr) => {
              if (machineNbr !== conf.machinePoolSize * images.length) {
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
                }, 100);
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
                }, 100);
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
                }, 100);
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
            user: null,
            image: imageId,
          });
        })
        .then((machines) => {
          expect(machines).to.have.length(2);
          return Machine.find({
            user: null,
          });
        })
        .then((machines) => {
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
          return Machine.find({
            user: null
          });
        })
        .then((machines) => {
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
                    }, 100);
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
              return Machine.findOne({
                user: adminId
              });
            })
            .then((userMachine) => {
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
                }, 100);
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
                    return Machine.find({
                      user: null
                    });
                  })
                  .then((machines) => {
                    assert.equal(machines.length, 2);
                    assert.isNull(machines[0].user);
                    return new Promise((resolve) => {
                      return setTimeout(function() {
                        return BrokerLog.find({
                          state: 'Stopped'
                        })
                          .then((log) => {
                            return resolve(log);
                          });
                      }, 100);
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
              }, 100); // Give broker time to cleanup instances
            });
        });
    });

    it('Should start the machine', (done) => {
      var machineId = null;
      return Machine.findOne({
        status: 'stopped',
        user: adminId
      })
        .then((machine) => {
          machineId = machine.id;
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
            Machine.findOne({
              user: adminId
            })
              .then((machine) => {
                assert.equal(machine.id, machineId);
                assert.equal(machine.user, adminId);
                assert.equal(machine.status, 'stopped');
                return new Promise((resolve) => {
                  setTimeout(() => {
                    return Promise.props({
                      machine: Machine.findOne({ user: adminId }),
                      log: BrokerLog.findOne({
                        state: 'Stopped',
                        machineId: machineId
                      })
                    })
                      .then((props) => {
                        return resolve(props);
                      });
                  }, 100);
                });
              })
              .then((props) => {
                assert.isDefined(props.log);
                assert.isDefined(props.machine);
                assert.equal(props.machine.status, 'stopped');
                return done();
              });
          }, 100);
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
          return Machine.find({
            user: null
          });
        })
        .then((machines) => {
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
                user: null,
                status: 'running'
              }));
            }, 100);
          });
        })
        .then((machines) => {
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
          return Promise.props({
            machines: Machine.find({
                user: null
              }),
            images: Image.find({
              deleted: false
            })
          });
        })
        .then(({machines, images}) => {
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
          return Machine.find({
            user: adminId
          });
        })
        .then((machines) => {
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
          return Machine.findOne({user: adminId});
        })
        .then((machine) => {
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
});
