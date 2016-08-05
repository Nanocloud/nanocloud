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

// jshint mocha:true

/* global MachineService, Machine, ConfigService */

const assert = require('chai').assert;
const request = require('request-promise');

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
                id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
                name: 'Admin'
              })
                .then(() => {
                  return Machine.count();
                })
                .then((machineNbr) => {
                  if (machineNbr !== conf.machinePoolSize + 1) {
                    throw new Error('A new machine should be created');
                  }
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
                })
                .then(() => {
                  return done();
                });
            });
        });
    });

    it('Should return the same machine for a user', (done) => {
      MachineService.getMachineForUser({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
        name: 'Admin'
      })
        .then((res) => {

          const userMachine = res.id;

          MachineService.getMachineForUser({
            id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
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

    it('Opening a session should update machine endDate', (done) => {
      MachineService.sessionOpen({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      })
        .then(() => {
          return MachineService.getMachineForUser({
            id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
            name: 'Admin'
          })
            .then((machine) => {
              assert.isNotNull(machine.endDate);
              return request('http://' + machine.ip + ':' + machine.plazaport + '/sessionOpen')
                .then(() => {
                  return machine.isSessionActive();
                })
                .then((active) => {
                  assert.isTrue(active);
                  return done();
                });
            });
        });
    });

    it('Should terminate machine if no connection occured after the maximum session duration time', (done) => {
      return MachineService.getMachineForUser({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
        name: 'Admin'
      })
        .then((machine) => {
          return request('http://' + machine.ip + ':' + machine.plazaport + '/sessionClose')
            .then(() => {
              return MachineService.sessionEnded({
                id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
              });
            })
            .then(() => {
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
                  })
                    .then(() => {
                    return done();
                  });
              }, 10); // Give broker time to cleanup instances
            });
        });
    });
  });
});
