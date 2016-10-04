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

/* global MachineService, Machine, ConfigService, BrokerLog */

const adminId = 'aff17b8b-bf91-40bf-ace6-6dfc985680bb';
const assert = require('chai').assert;
const request = require('request-promise');
const Promise = require('bluebird');

describe('Machine Service', () => {

  describe('Broker', () => {

    before('Force machine to terminate if no one is connected', function(done) {

      ConfigService.set('sessionDuration', 0)
        .then(() => {
          return done();
        });
    });

    it('Should provision new machine when one is affected to a user', (done) => {
      Machine.find({
        user: null
      })
        .then((machines) => {
          ConfigService.get('machinePoolSize')
            .then((conf) => {
              if (machines.length !== conf.machinePoolSize) {
                throw new Error('Available machines should be equal to machine pool size');
              }

              return MachineService.getMachineForUser({
                id: adminId,
                name: 'Admin'
              })
                .then(() => {
                  return new Promise((resolve, reject) => {
                    setTimeout(() => {
                      Machine.count()
                        .then((machineNbr) => {

                          if (machineNbr !== conf.machinePoolSize + 1) {
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
                  if (machineNbr !== conf.machinePoolSize) {
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
                  assert.equal(logs[0].machineFlavor, 'dummy');
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
                  assert.equal(machineLogs[0].machineFlavor, 'dummy');
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
                  if (logs.length !== 2) {
                    throw new Error('Broker should log when machine pool need to be update');
                  }
                  assert.isNull(logs[0].machineId);
                  assert.equal(logs[0].state, 'Update machine pool from 0 to 1 (+1)');
                  assert.equal(logs[0].machineDriver, 'dummy');
                })
                .then(() => {
                  return done();
                });
            });
        });
    });

    it('Should return the same machine for a user', (done) => {
      MachineService.getMachineForUser({
        id: adminId,
        name: 'Admin'
      })
        .then((res) => {

          const userMachine = res.id;

          MachineService.getMachineForUser({
            id: adminId,
            name: 'Admin'
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
      MachineService.getMachineForUser({
        id: adminId,
        name: 'Admin'
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
      MachineService.sessionOpen({
        id: adminId
      })
        .then(() => {
          return MachineService.getMachineForUser({
            id: adminId,
            name: 'Admin'
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
                  assert.equal(logs[0].machineFlavor, 'dummy');
                  return done();
                });
            });
        });
    });

    it('Should return an active session', (done) => {
      MachineService.getMachineForUser({
        id: adminId,
        name: 'Admin'
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
        name: 'Admin'
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
      return MachineService.getMachineForUser({
        id: adminId,
        name: 'Admin'
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
      return MachineService.getMachineForUser({
        id: adminId,
        name: 'Admin'
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
      return MachineService.getMachineForUser({
        id: adminId,
        name: 'Admin'
      })
        .then((machine) => {
          return request('http://' + machine.ip + ':' + machine.plazaport + '/sessionClose')
            .then(() => {
              return MachineService.sessionEnded({
                id: adminId
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
              assert.equal(logs[0].machineFlavor, 'dummy');
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
                    return new Promise((resolve) => {
                      return setTimeout(function() {
                        return BrokerLog.find({
                          state: 'Deleted'
                        })
                          .then((log) => {
                            return resolve(log);
                          });
                      }, 100);
                    });
                  })
                  .then((logs) => {
                    if (!logs.length || !logs[0].machineId.length) {
                      throw new Error('Broker should log when a machine is terminated');
                    }
                    assert.isNotNull(logs[0].machineId);
                    assert.equal(logs[0].state, 'Deleted');
                    assert.equal(logs[0].machineDriver, 'dummy');
                    assert.equal(logs[0].machineFlavor, 'dummy');
                    return done();
                  });
              }, 100); // Give broker time to cleanup instances
            });
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
      Machine.find({
        user: null
      })
        .then((machines) => {
          ConfigService.get('machinePoolSize')
            .then((conf) => {
              var machineId = null;
              if (machines.length !== conf.machinePoolSize) {
                throw new Error('Available machines should be equal to machine pool size');
              }

              return MachineService.getMachineForUser({
                id: adminId,
                name: 'Admin'
              })
                .then((machine) => {
                  machineId = machine.id;
                  return new Promise((resolve, reject) => {
                    setTimeout(() => {
                      Machine.count()
                        .then((machineNbr) => {

                          if (machineNbr !== conf.machinePoolSize + 1) {
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
                  if (machineNbr !== conf.machinePoolSize) {
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
                  assert.equal(logs[0].machineFlavor, 'dummy');
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
                  assert.equal(machineLogs[0].machineFlavor, 'dummy');
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
                  if (logs.length !== 4) {
                    throw new Error('Broker should log when machine pool need to be update');
                  }
                  assert.isNull(logs[0].machineId);
                  assert.equal(logs[0].state, 'Update machine pool from 0 to 1 (+1)');
                  assert.equal(logs[0].machineDriver, 'dummy');
                })
                .then(() => {
                  return done();
                });
            });
        });
    });

    it('Should return the same machine for a user', (done) => {
      MachineService.getMachineForUser({
        id: adminId,
        name: 'Admin'
      })
        .then((res) => {

          const userMachine = res.id;

          MachineService.getMachineForUser({
            id: adminId,
            name: 'Admin'
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
      MachineService.getMachineForUser({
        id: adminId,
        name: 'Admin'
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
      MachineService.sessionOpen({
        id: adminId
      })
        .then(() => {
          return MachineService.getMachineForUser({
            id: adminId,
            name: 'Admin'
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
                  assert.equal(logs[0].machineFlavor, 'dummy');
                  return done();
                });
            });
        });
    });

    it('Should return an active session', (done) => {
      MachineService.getMachineForUser({
        id: adminId,
        name: 'Admin'
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
        name: 'Admin'
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
        name: 'Admin'
      })
        .then((machine) => {
          return request('http://' + machine.ip + ':' + machine.plazaport + '/sessionClose')
            .then(() => {
              return MachineService.sessionEnded({
                id: adminId
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
              assert.equal(logs[0].machineFlavor, 'dummy');
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
                    assert.equal(machines.length, 1);
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
                    assert.equal(logs[0].machineFlavor, 'dummy');
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
            name: 'Admin'
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
});
