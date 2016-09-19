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
                  return BrokerLog.find({
                    userId: adminId,
                    state: 'Assigned',
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
                  return BrokerLog.find({
                    machineId: logs[0].machineId,
                    state: 'Created'
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
                  return BrokerLog.find({
                    userId: null,
                    state: {
                      like: '%Update machine pool%'
                    }
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
                  return BrokerLog.find({
                    userId: adminId,
                    state: 'Opened'
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
                    assert.equal(logs[0].machineFlavor, 'dummy');
                    return done();
                  });
              }, 100); // Give broker time to cleanup instances
            });
        });
    });
  });
});
