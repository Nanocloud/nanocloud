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

/* globals sails, User, Image, AccessToken, MachineService, Group */
/* globals ConfigService, StorageService, Machine, Team, BrokerLog */
/* globals PendingUser */

const nano = require('./lib/nanotest');

module.exports = function() {

  describe('Security', function() {

    let token = null;
    let userId = null;

    before('Generate a regular user, a token, a group and storage', function(done) {

      ConfigService.set('testMail', true);

      User.create({
        firstName: 'Test',
        lastName: 'Test',
        password: 'tests',
        email: 'test@test.com',
        isAdmin: false,
        expirationDate: null,
      })
        .then((user) => {
          userId = user.id;
          return AccessToken.create({
            userId: user.id
          });
        })
        .then((res) => {
          token = res.token;
          return done();
        });
    });

    after('Delete created user', function(done) {
      User.destroy({
        email: 'test@test.com'
      })
        .then(() => {
          AccessToken.destroy({
            userId: userId
          });
        })
        .then(() => {
          return done();
        });
      ConfigService.unset('testMail');
    });

    describe('History', function() {
      describe('Create history - Only possible from Guacamole', function() {
        it('Should not create history with no token', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/histories')
            .send({})
            .expect(401)
            .end(done);
        });
        it('Should not create history even with token', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/histories')
            .send({})
            .set(nano.adminLogin())
            .expect(401)
            .end(done);
        });
        it('Should not create history if coming from Guacamole', function(done) {
          MachineService.getMachineForUser({
            id: nano.adminId()
          })
            .then(() => {
              nano.request('http://localhost:1337')
                .post('/api/histories')
                .send()
                .expect(400)
                .end(done);
            });
        });
      });

      describe('Read history - Only possible has loggedin user', function() {
        it('Should not return history with no token', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/histories')
            .expect(401)
            .end(done);
        });
        it('Should return history with token', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/histories')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });
      });

      describe('Update history - Only possible from Guacamole', function() {

        it('Should not update history with no token', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/histories/')
            .send({})
            .expect(401)
            .end(done);
        });
        it('Should not create history even with token', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/histories')
            .send({})
            .set(nano.adminLogin())
            .expect(401)
            .end(done);
        });
        it('Should not create history if coming from Guacamole', function(done) {
          MachineService.getMachineForUser({
            id: nano.adminId()
          })
            .then(() => {
              nano.request('http://localhost:1337')
                .post('/api/histories/' + 'fakeid')
                .send([])
                .expect(400)
                .end(done);
            });
        });
      });

      describe('Delete history', function() {

        it('Should not delete with no token', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/histories')
            .expect(403)
            .end(done);
        });
        it('Should not delete even with a token', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/histories')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });
        it('Should not delete even from guacamole', function(done) {
          nano.request('http://localhost:1337')
            .delete('/api/histories')
            .expect(403)
            .end(done);
        });
      });
    });

    describe('Config', function() {

      describe('Create config acts like update - Only possible for admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/configs')
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  key: 'host',
                  value: 'localhost'
                },
                type: 'configs'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/configs')
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  key: 'host',
                  value: 'localhost'
                },
                type: 'configs'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/configs')
            .send({
              data: {
                attributes: {
                  key: 'host',
                  value: 'localhost'
                },
                type: 'configs'
              }
            })
            .expect(401)
            .end(done);
        });

      });

      describe('Read config - Possible for admins and regular users', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/configs?key=host')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/configs?key=host')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/configs?key=host')
            .expect(401)
            .end(done);
        });
      });

      describe('Read one config - Possible for admins and regular users', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/configs/host')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/configs/host')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/configs/host')
            .expect(401)
            .end(done);
        });
      });

      describe('Update config - forbidden use create instead', function() {

        it('Admins should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/configs/host')
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  value: 'local',
                },
                type: 'configs'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/configs/host')
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  value: 'local',
                },
                type: 'configs'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/configs/host')
            .send({
              data: {
                attributes: {
                  value: 'local',
                },
                type: 'configs'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Delete config - forbidden for everyone', function() {

        it('Admins should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/configs/host')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/configs/host')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/configs/host')
            .expect(401)
            .end(done);
        });
      });
    });

    describe('api/apps', function() {
      let appId = null;
      let imageId = null;
      let localGroupId = null;

      before('Get default image ID', function(done) {
        Image.findOne({
          default: true
        })
          .then((image) => {
            imageId = image.id;
            done();
          });
      });

      after('Delete the created group', function(done) {
        Group.destroy({
          id: localGroupId
        })
          .then(() => {
            done();
          });
      });

      describe('Create an app - only admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/apps')
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  alias: 'tempo',
                  'collection-name': 'tempo',
                  'display-name': 'tempo',
                  'file-path': 'C:\\Windows\\System32\\notepad.exe',
                  'image': imageId
                },
                type: 'apps'
              }
            })
            .expect(201)
            .expect((res) => {
              appId = res.body.data.id;
              Group.create({
                name: 'groupTest',
                members: {
                  id: userId
                },
                images: {
                  id: imageId
                }
              })
                .then((group) => {
                  localGroupId = group.id;
                });
            })
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/apps')
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  alias: 'tempo',
                  'collection-name': 'tempo',
                  'display-name': 'tempo',
                  'file-path': 'C:\\Windows\\System32\\notepad.exe',
                  'image': imageId
                },
                type: 'apps'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/apps')
            .send({
              data: {
                attributes: {
                  alias: 'tempo',
                  'collection-name': 'tempo',
                  'display-name': 'tempo',
                  'file-path': 'C:\\Windows\\System32\\notepad.exe',
                  'image': imageId
                },
                type: 'apps'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Get apps - only logged in users', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/apps')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/apps')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/apps')
            .expect(401)
            .end(done);
        });
      });

      describe('Get a specific app - only for admins and owners of this app', function() {

        it('Admins should be authorized to see all apps', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/apps/' + appId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized if his group have this associated app', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/apps/' + appId)
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized to see app of other group', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/apps/' + nano.adminId())
            .set('Authorization', 'Bearer ' + token)
            .expect(404)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/apps/' + appId)
            .expect(401)
            .end(done);
        });
      });

      describe('Update a specific app - logged in users', function() {

        it('Admin users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/apps/' + appId)
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  alias: 'essai'
                },
                type: 'apps'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/apps/' + appId)
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  alias: 'reza'
                },
                type: 'apps'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/apps/' + appId)
            .send({
              data: {
                attributes: {
                  alias: 'test'
                },
                type: 'apps'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Delete an app - only admins', function() {

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/apps/' + appId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/apps/' + appId)
            .expect(401)
            .end(done);
        });

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/apps/' + appId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });
      });
    });

    describe('Group', function() {

      let groupId = null;

      before('Create a group', function(done) {
        Group.create({
          name: 'group'
        })
          .then((res) => {
            groupId = res.id;
            return done();
          });
      });

      describe('Create group - only possible for admins', function() {

        it('Admins should be authorized - return created', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/groups')
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  name: 'Test'
                },
                type: 'groups'
              }
            })
            .expect(201)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/groups')
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  name: 'Test'
                },
                type: 'groups'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/groups')
            .send({
              data: {
                attributes: {
                  name: 'Test'
                },
                type: 'groups'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Read group - only possible for admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/groups')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/groups')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/groups')
            .expect(401)
            .end(done);
        });
      });

      describe('Read one group - only possible for admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/groups/' + groupId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });
        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/groups/' + groupId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/groups/' + groupId)
            .expect(401)
            .end(done);
        });
      });

      describe('Update group - only possible for admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/groups/' + groupId)
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  name: 'group2'
                },
                id: groupId,
                type: 'groups'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/groups/' + groupId)
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  name: 'group2'
                },
                id: groupId,
                type: 'groups'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/groups/' + groupId)
            .send({
              data: {
                attributes: {
                  name: 'group2'
                },
                id: groupId,
                type: 'groups'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Delete group - only possible for admins', function() {
        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/groups/' + groupId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/groups/' + groupId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/groups/' + groupId)
            .expect(401)
            .end(done);
        });
      });
    });

    describe('api/machines', function() {
      let machineId1 = null;
      let machineId = null;

      before('Set two machines for tests', function(done){

        Machine.create([{
          name: 'cdr',
          type: 't2.medium',
          ip: '1.1.1.1',
          username: 'Administrator',
          password: 'secret'
        },
        {
          name: 'cdr1',
          type: 't2.medium',
          ip: '1.1.1.2',
          username: 'Administrator',
          password: 'secret'
        }])
          .then((machines) => {
            machineId = machines[0].id;
            machineId1 = machines[1].id;
          })
          .then(() => {
            return done();
          });
      });

      after('Clean this machines', function(done) {
        Machine.query('DELETE FROM machine WHERE "ip"=\'1.1.1.1\' OR "ip"=\'1.1.1.2\'', done);
      });

      describe('Create a machine (POST)', function() {

        it('Admins should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/machines')
            .send({
              data: {
                attributes: {
                  name: 'essai',
                  type: 't2.medium',
                  ip: '1.1.1.1',
                  username: 'Administrator',
                  password: 'essai',
                  user: nano.adminId()
                },
                type: 'machines'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/machines')
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  name: 'essai',
                  type: 't2.medium',
                  ip: '1.1.1.1',
                  username: 'Administrator',
                  password: 'essai',
                  user: userId
                },
                type: 'machines'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/machines')
            .send({
              data: {
                attributes: {
                  name: 'essai',
                  type: 't2.medium',
                  ip: '1.1.1.1',
                  username: 'Administrator',
                  password: 'essai',
                },
                type: 'machines'
              }
            })
            .expect(403)
            .end(done);
        });
      });

      describe('Get users machines - Only logged in users', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/machines')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/machines')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/machines')
            .expect(401)
            .end(done);
        });
      });

      describe('Get user machines - only machines assigned to this user', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/machines/users')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/machines/users')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/machines/users')
            .expect(401)
            .end(done);
        });
      });

      describe('Get a specific machine', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/machines/' + machineId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/machines/' + machineId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/machines/' + machineId)
            .expect(401)
            .end(done);
        });
      });

      describe('Update a specific machine', function() {

        it('Admin users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/machines/' + machineId)
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  name: 'azer',
                  type: 't2.medium',
                  ip: '1.1.1.1',
                  username: 'Administrator',
                  password: 'essai',
                },
                type: 'machines'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/machines/' + machineId)
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  name: 'azer',
                  type: 't2.medium',
                  ip: '1.1.1.1',
                  username: 'Administrator',
                  password: 'essai',
                },
                type: 'machines'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/machines/' + machineId)
            .send({
              data: {
                attributes: {
                  name: 'azer',
                  type: 't2.medium',
                  ip: '1.1.1.1',
                  username: 'Administrator',
                  password: 'essai',
                },
                type: 'machines'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Delete a machine', function() {

        it('Admins should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/machines/' + machineId)
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/machines/' + machineId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/machines/' + machineId)
            .expect(403)
            .end(done);
        });
      });
    });

    describe('Storage', function() {

      let storageId = null;
      let filename = 'security.test.js';
      let downloadToken = null;

      before('Create a storage', function(done) {
        User.create({
          firstName: 'Test',
          lastName: 'Test',
          password: 'tests',
          email: 'test@test2.com',
          isAdmin: false,
          expirationDate: null,
        })
          .then((user) => {
            StorageService.findOrCreate(user)
              .then((storage) => {
                storageId = storage.id;
                return done();
              });
          });
      });

      after('Delete created user', function(done) {
        User.destroy({
          email: 'test@test2.com'
        })
          .then(() => {
            return done();
          });
      });

      describe('Create Storage - not available from api', function() {

        it('Admins should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/storages')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/storages')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/storages')
            .expect(403)
            .end(done);
        });
      });

      describe('Read all storage - not available from api', function() {

        it('Admins should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/storages')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/storages')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/storages')
            .expect(403)
            .end(done);
        });
      });

      describe('Read one storage - not available from api', function() {

        it('Admins should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/storages/' + storageId)
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/storages/' + storageId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/storages/' + storageId)
            .expect(403)
            .end(done);
        });
      });

      describe('Update storage - not available from api', function() {

        it('Admins should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/storages/' + storageId)
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  port: 1111
                },
                id: storageId,
                type: 'storages'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/storages/' + storageId)
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  port: 1111
                },
                id: storageId,
                type: 'storages'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/storages/' + storageId)
            .send({
              data: {
                attributes: {
                  port: 1111
                },
                id: storageId,
                type: 'storages'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Delete storage - not available from api', function() {

        it('Admins should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/storages/' + storageId)
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/storages/' + storageId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/storages/' + storageId)
            .expect(403)
            .end(done);
        });
      });

      describe('Upload a file - available for logged in users', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/upload?filename=' + filename)
            .attach(filename, './tests/api/security.test.js', filename)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/upload?filename=' + filename)
            .attach(filename, './tests/api/security.test.js', filename)
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/upload?filename=' + filename)
            .attach(filename, './tests/api/security.test.js', filename)
            .expect(401)
            .end(done);
        });
      });

      describe('Get a list of file - available for logged in users', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files')
            .expect(401)
            .end(done);
        });
      });

      describe('Get a download token - available for logged in users', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files/token?filename=' + filename)
            .set(nano.adminLogin())
            .expect((res) => {
              downloadToken = res.body.token;
            })
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files/token?filename=' + filename)
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files/token?filename=' + filename)
            .expect(401)
            .end(done);
        });
      });

      describe('Download a file - available only with a valid download token either with authorization or not', function() {

        it('Request with a valid download token and authorization should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files/download?filename=' + filename + '&token=' + downloadToken)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Request with a valid download token and without authorization should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files/download?filename=' + filename + '&token=' + downloadToken)
            .expect(200)
            .end(done);
        });

        it('Request with a fake token should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files/download?filename=' + filename + '&token=1:3a1133a907c373e3ee7121333d3a1ea0de12aa88')
            .expect(403)
            .end(done);
        });

        it('Request with a fake token should be forbidden even with authorization', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/files/download?filename=' + filename + '&token=1:3a1133a907c373e3ee7121333d3a1ea0de12aa88')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });
      });
    });

    describe('Pending-user', function() {

      let adminPendingUserToken = null;
      let ruPendingUserToken = null;
      let nologPendingUserToken = null;
      let adminPendingUser = null;
      let ruPendingUser = null;
      let nologPendingUser = null;

      describe('Create pending user - available for everyone', function() {

        it('Admins should be authorized to create a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/pendingusers')
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  email: 'pending-user1@test.com',
                  firstName: 'Test',
                  lastName: 'Test',
                  password: '123Password'
                },
                type: 'pendingusers'
              }
            })
            .expect(201)
            .then((res) => {
              return PendingUser.findOne({
                id: res.body.data.id
              });
            })
            .then((res) => {
              adminPendingUserToken = res.token;
              adminPendingUser = res.id;
            })
            .then(() => {
              return done();
            });
        });

        it('Regular users should be authorized to create a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/pendingusers')
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  email: 'pending-user2@test.com',
                  firstName: 'Test',
                  lastName: 'Test',
                  password: '123Password'
                },
                type: 'pendingusers'
              }
            })
            .expect(201)
            .then((res) => {
              return PendingUser.findOne({
                id: res.body.data.id
              });
            })
            .then((res) => {
              ruPendingUserToken = res.token;
              ruPendingUser = res.id;
            })
            .then(() => {
              return done();
            });
        });

        it('Not logged in user should be authorized to create a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/pendingusers')
            .send({
              data: {
                attributes: {
                  email: 'pending-user3@test.com',
                  firstName: 'Test',
                  lastName: 'Test',
                  password: '123Password'
                },
                type: 'pendingusers'
              }
            })
            .expect(201)
            .then((res) => {
              return PendingUser.findOne({
                id: res.body.data.id
              });
            })
            .then((res) => {
              nologPendingUserToken = res.token;
              nologPendingUser = res.token;
            })
            .then(() => {
              return done();
            });
        });
      });

      describe('Get all pending users - only for admins', function() {

        it('Admins should be authorized to get all pending users', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/pendingusers')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized to get all pending users', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/pendingusers')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Not logged in user should be unauthorized to get all pending users', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/pendingusers')
            .expect(401)
            .end(done);
        });
      });

      describe('Get a pending user - available for logged in user', function() {

        it('Admins should be authorized to get a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/pendingusers/' + adminPendingUser)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized to get pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/pendingusers/' + ruPendingUser)
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Not logged in user should be authorized to get a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/pendingusers/' + nologPendingUser)
            .expect(401)
            .end(done);
        });
      });

      describe('Delete a pending user - not available from api', function() {

        it('Admins should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/pendingusers/' + adminPendingUser)
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/pendingusers/' + ruPendingUser)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be forbidden', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/pendingusers/' + nologPendingUser)
            .expect(403)
            .end(done);
        });
      });

      describe('Update/activate a pending user - available for everyone', function() {

        it('Admins should be authorized to activate a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/pendingusers/' + adminPendingUserToken)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized to activate a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/pendingusers/' + ruPendingUserToken)
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Not logged in user should be authorized to activate a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/pendingusers/' + nologPendingUserToken)
            .expect(200)
            .end(done);
        });
      });
    });

    describe('Images', function() {

      let image = null;

      describe('Create an image - available for admins only', function() {

        it('Admins should be authorized to create an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/images')
            .set(nano.adminLogin())
            .expect((res) => {
              image = res.body.data.id;
            })
            .expect(201)
            .end(done);
        });

        it('Regular users should be forbidden to create an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Not logged in user should be unauthorized to create an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/images')
            .expect(401)
            .end(done);
        });
      });

      describe('Get all images - available for logged in users', function() {

        it('Admins should be authorized to get all images', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/images')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized to get all images', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/images')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Not logged in user should be unauthorized to get all images', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/images')
            .expect(401)
            .end(done);
        });
      });

      describe('Get an image - available for logged in users', function() {

        it('Admins should be authorized to get an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/images/' + image)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized to get an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/images/' + image)
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Not logged in user should be unauthorized to get an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/images/' + image)
            .expect(401)
            .end(done);
        });
      });

      describe('Update an image - not available', function() {

        it('Admins should be fobidden to update an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/images/' + image)
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden to update an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/images/' + image)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Not logged in user should be forbidden to update an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/images/' + image)
            .expect(403)
            .end(done);
        });
      });

      describe('Delete an image - not available', function() {

        it('Admins should be forbidden to delete an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/images/' + image)
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden to delete an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/images/' + image)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Not logged in user should be forbidden to delete an image', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/images/' + image)
            .expect(403)
            .end(done);
        });
      });
    });

    describe('Property', function() {

      describe('Create a property - not available', function() {

        it('Admins should be forbidden to create a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/properties')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden to create a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/properties')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Not logged in user should be forbidden to create a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/properties')
            .expect(403)
            .end(done);
        });
      });

      describe('Get all properties - available for all users even not logged in user', function() {

        it('Admins should be authorized to get all properties', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/properties')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized to get all properties', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/properties')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Not logged in user should be authorized to get all properties', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/properties')
            .expect(200)
            .end(done);
        });
      });

      describe('Get a property - not available', function() {

        it('Admins should be authorized to get a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/properties/1')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be authorized to get a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/properties/1')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Not logged in user should be authorized to get a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/properties/1')
            .expect(403)
            .end(done);
        });
      });

      describe('Update a property - not available', function() {

        it('Admins should be forbidden to update a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/properties/1')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users  should be forbidden to update a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/properties/1')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Not logged in user should be forbidden to update a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/properties/1')
            .expect(403)
            .end(done);
        });
      });

      describe('Delete a property - not available', function() {

        it('Admins should be forbidden to delete a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/properties/1')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users  should be forbidden to delete a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/properties/1')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Not logged in user should be forbidden to delete a property', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/properties/1')
            .expect(403)
            .end(done);
        });
      });
    });

    describe('Nanocloud', function() {

      describe('Create something with Nanocloud controller - not available', function() {
        it('Should be not found even if user is an admin', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/nanoclouds')
            .set(nano.adminLogin())
            .expect(404)
            .end(done);
        });

        it('Should be not found even if user is a regular user', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/nanoclouds')
            .set('Authorization', 'Bearer ' + token)
            .expect(404)
            .end(done);
        });

        it('Should be not found even if user is not logged in', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/nanoclouds')
            .expect(404)
            .end(done);
        });
      });

      describe('Get something from Nanocloud controller - not available', function() {
        it('Should be not found even if user is an admin', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/nanoclouds')
            .set(nano.adminLogin())
            .expect(404)
            .end(done);
        });

        it('Should be not found even if user is a regular user', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/nanoclouds')
            .set('Authorization', 'Bearer ' + token)
            .expect(404)
            .end(done);
        });

        it('Should be not found even if user is not logged in', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/nanoclouds')
            .expect(404)
            .end(done);
        });
      });

      describe('Get something scpecific from Nanocloud controller - not available', function() {
        it('Should be not found even if user is an admin', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/nanoclouds/1')
            .set(nano.adminLogin())
            .expect(404)
            .end(done);
        });

        it('Should be not found even if user is a regular user', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/nanoclouds/1')
            .set('Authorization', 'Bearer ' + token)
            .expect(404)
            .end(done);
        });

        it('Should be not found even if user is not logged in', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/nanoclouds/1')
            .expect(404)
            .end(done);
        });
      });

      describe('Delete something from Nanocloud controller - not available', function() {
        it('Should be not found even if user is an admin', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/nanoclouds/1')
            .set(nano.adminLogin())
            .expect(404)
            .end(done);
        });

        it('Should be not found even if user is a regular user', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/nanoclouds/1')
            .set('Authorization', 'Bearer ' + token)
            .expect(404)
            .end(done);
        });

        it('Should be not found even if user is not logged in', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/nanoclouds/1')
            .expect(404)
            .end(done);
        });
      });
    });

    describe('Users', function() {
      let aUserId = null;

      describe('Create a user - only admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/users')
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  'first-name': 'aaaa',
                  'last-name': 'aaaa',
                  password: 'aaaaaaaa',
                  email: 'a@a.a',
                  'is-admin': false,
                  'expiration-date': 0
                },
                type: 'users'
              }
            })
            .expect(201)
            .expect((res) => {
              aUserId = res.body.data.id;
            })
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/users')
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  'first-name': 'bbbb',
                  'last-name': 'bbbb',
                  password: 'bbbbbbbbb',
                  email: 'b@b.b',
                  'is-admin': false,
                  'expiration-date': 0
                },
                type: 'users'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/users')
            .send({
              data: {
                attributes: {
                  'first-name': 'cccc',
                  'last-name': 'cccc',
                  password: 'cccccccc',
                  email: 'c@c.c',
                  'is-admin': false,
                  'expiration-date': 0
                },
                type: 'users'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Get users - only admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users')
            .expect(401)
            .end(done);
        });
      });

      describe('Get the actual user - only logged in users', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users?me=true')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users?me=true')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users?me=true')
            .expect(401)
            .end(done);
        });
      });

      describe('Get a specific user - only logged in users', function() {

        it('Admins should be authorized to see other user', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users/' + userId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized if it\'s their id', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users/' + userId)
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized to see other user account', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users/' + nano.adminId())
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/users/' + userId)
            .expect(401)
            .end(done);
        });
      });

      describe('Update a specific user - only logged in users', function() {

        it('Admin users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/users/' + userId)
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  name: 'azer'
                },
                type: 'users'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized if it\'s their account', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/users/' + userId)
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  name: 'reza'
                },
                type: 'users'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized if it\'s not their account', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/users/' + nano.adminId())
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  name: 'essai'
                },
                type: 'users'
              }
            })
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/users/' + userId)
            .send({
              data: {
                attributes: {
                  name: 'test'
                },
                type: 'users'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Delete a user - only for admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/users/' + aUserId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/users/' + userId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/users/' + userId)
            .expect(401)
            .end(done);
        });
      });
    });

    describe('api/reset-password', function() {
      let resetPasswordId = null;
      let allRequests = [];

      before('Create a request of reset password', function(done) {
        global['Reset-password'].create({
          email: 'test@test.com'
        })
          .then((request) => {
            resetPasswordId = request.id;
            done();
          });
      });

      describe('Create a reset password request - accessible to everyone', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/reset-passwords')
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  email: 'test@test.com'
                },
                type: 'reset-passwords'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Regular users should authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/reset-passwords')
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  email: 'test@test.com'
                },
                type: 'reset-passwords'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Request without authorization should authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .post('/api/reset-passwords')
            .send({
              data: {
                attributes: {
                  email: 'test@test.com'
                },
                type: 'reset-passwords'
              }
            })
            .expect(200)
            .end(done);
        });
      });

      describe('Get all requests of reset password - only admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/reset-passwords')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/reset-passwords')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/reset-passwords')
            .expect(401)
            .end(done);
        });
      });

      describe('Get a specific request - accessible to everyone', function() {

        it('Admins should be authorized to see all apps', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/reset-passwords/' + resetPasswordId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/reset-passwords/' + resetPasswordId)
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/reset-passwords/' + resetPasswordId)
            .expect(200)
            .end(done);
        });
      });

      describe('Update a specific request of reset password - accessible to everyone', function() {

        before('retrieve the created request', function(done) {
          global['Reset-password'].find({
            id: {
              '!': resetPasswordId
            }
          })
            .then((res) => {
              allRequests = res;
              return done();
            });
        });

        it('Admin users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/reset-passwords/' + allRequests[0].id)
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  email: 'test@test.com',
                  password: 'aaaaaaaa'
                },
                type: 'reset-passwords'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/reset-passwords/' + allRequests[1].id)
            .set('Authorization', 'Bearer ' + token)
            .send({
              data: {
                attributes: {
                  email: 'test@test.com',
                  password: 'bbbbbbbb'
                },
                type: 'reset-passwords'
              }
            })
            .expect(200)
            .end(done);
        });

        it('Request without authorization should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/reset-passwords/' + allRequests[2].id)
            .send({
              data: {
                attributes: {
                  email: 'test@test.com',
                  password: 'bbbbbbbb'
                },
                type: 'reset-passwords'
              }
            })
            .expect(200)
            .end(done);
        });
      });

      describe('Delete a request of reset password - only admins', function() {

        it('Admins should be authorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/reset-passwords/' + resetPasswordId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/reset-passwords/' + allRequests[0].id)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Request without authorization should be unauthorized', function(done) {
          return nano.request(sails.hooks.http.app)
            .delete('/api/reset-passwords/' + allRequests[0].id)
            .expect(401)
            .end(done);
        });
      });
    });

    describe('api/brokerlogs', function() {
      let BrokerLogId = null;

      before('Create a broker log', function(done) {
        BrokerLog.create({
          machineId: 'i-54654',
          state: 'Created'
        })
          .then((log) => {
            BrokerLogId = log.id;
            done();
          });
      });

      describe('List all broker logs (GET)', function () {

        it('Admin should be authorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/brokerlogs')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/brokerlogs')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/brokerlogs')
            .expect(401)
            .end(done);
        });
      });

      describe('Create a broker log', function () {

        it('Admin should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/brokerlogs')
            .send({
              data: {
                attributes: {
                  'machine-id': 'i-14654',
                  state: 'Created'
                },
                type: 'brokerlog'
              }
            })
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/brokerlogs')
            .send({
              data: {
                attributes: {
                  'machine-id': 'i-14654',
                  state: 'Created'
                },
                type: 'brokerlog'
              }
            })
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users token should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/brokerlogs')
            .send({
              data: {
                attributes: {
                  'machine-id': 'i-14654',
                  state: 'Created'
                },
                type: 'brokerlog'
              }
            })
            .expect(403)
            .end(done);
        });
      });

      describe('find a specific broker log', function () {

        it('Admin should be authorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/brokerlogs/' + BrokerLogId)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/brokerlogs/' + BrokerLogId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users token should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/brokerlogs/' + BrokerLogId)
            .expect(401)
            .end(done);
        });
      });

      describe('Update a broker log', function () {

        it('Admin should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .patch('/api/brokerlogs/' + BrokerLogId)
            .send({
              data: {
                attributes: {
                  'machine-id': 'i-14654',
                  state: 'DELETED'
                },
                type: 'brokerlog'
              }
            })
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .patch('/api/brokerlogs/' + BrokerLogId)
            .send({
              data: {
                attributes: {
                  'machine-id': 'i-14654',
                  state: 'DELETED'
                },
                type: 'brokerlog'
              }
            })
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users token should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .patch('/api/brokerlogs/' + BrokerLogId)
            .send({
              data: {
                attributes: {
                  'machine-id': 'i-14654',
                  state: 'DELETED'
                },
                type: 'brokerlog'
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('DELETE broker log', function () {

        it('Admin should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/brokerlogs/' + BrokerLogId)
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/brokerlogs/' + BrokerLogId)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users token should be forbidden', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/brokerlogs/' + BrokerLogId)
            .expect(403)
            .end(done);
        });
      });
    });

    describe('api/sessions', function() {

      before('clear', function(done) {
        MachineService.getMachineForUser({id: userId})
          .then(() => {
            MachineService.getMachineForUser({id: nano.adminId()});
          })
          .then(() => {
            done();
          });
      });

      describe('List all sessions (GET)', function () {

        it('Admin should be authorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/sessions')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/sessions')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/sessions')
            .expect(401)
            .end(done);
        });
      });

      describe('DELETE all open sessions', function () {

        it('Admin should be authorized', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/sessions')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/sessions')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Unauthenticate users token should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/sessions')
            .expect(401)
            .end(done);
        });
      });
    });

    describe('Teams', function() {

      let team1;
      let team2;
      let user1;
      let user2;
      /*
       * Create teams and users following this configuration:
       *
       * Team1. Admin is team admin. User1 is member
       * Team2, User2 is team admin
       */
      before('Create team and team admins', function(done) {

        Team.create({
          name: 'Team1'
        })
          .then((team) => {
            team1 = team;

            return Team.create({
              name: 'Team2'
            });
          })
          .then((team) => {
            team2 = team;

            return User.create({
              email: 'user1@nanocloud.com',
              isTeamAdmin: false,
              team: team1.id,
              isAdmin: false
            });
          })
          .then((user) => {
            user1 = user;

            return User.create({
              email: 'user2@nanocloud.com',
              isTeamAdmin: true,
              team: team2.id,
              isAdmin: false
            });
          })
          .then((user) => {
            user2 = user;

            return User.update(nano.adminId(), {
              isTeamAdmin: true,
              team: team1.id
            });
          })
          .then(() => {
            return AccessToken.create({
              userId: user1.id
            });
          })
          .then((tokenUser1) => {
            user1.token = tokenUser1.token;

            return AccessToken.create({
              userId: user2.id
            });
          })
          .then((tokenUser2) => {
            user2.token = tokenUser2.token;
          })
          .then(() => {
            return done();
          });
      });

      after('Cleaning created teams and users', function(done) {

        User.destroy([
          user1.id,
          user2.id
        ])
          .then(() => {
            return AccessToken.destroy({
              token: [user1.token, user2.token]
            });
          })
          .then(() => {
            return Team.destroy([
              team1.token,
              team2.token
            ]);
          })
          .then(() => {
            return done();
          });
      });

      describe('List all teams - Only available for admins', function() {

        it('Admin should be authorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/teams')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/teams')
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users token should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/teams')
            .expect(401)
            .end(done);
        });
      });

      describe('Get one team - Allowed for admins and regular users if member of the team', function() {

        it('Admin should be authorized if they are team admins', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/teams/' + team1.id)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Admin should be authorized even if they are not team admins', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/teams/' + team2.id)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized if team member', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/teams/' + team1.id)
            .set('Authorization', 'Bearer ' + user1.token)
            .expect(200)
            .end(done);
        });

        it('Regular users should be unauthorized if not member', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/teams/' + team1.id)
            .set('Authorization', 'Bearer ' + user2.token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users token should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/teams/' + team1.id)
            .expect(401)
            .end(done);
        });
      });

      describe('Create a team - available for logged in users', function() {

        let user3;

        before('create temporary user', function(done) {

          User.create({
            email: 'user3@nanocloud.com',
            team: null,
            isTeamAdmin: false,
            isAdmin: false
          })
            .then((user) => {
              user3 = user;

              return AccessToken.create({
                userId: user3.id
              });
            })
            .then((user3Token) => {
              user3.token = user3Token.token;
            })
            .then(() => {
              return done();
            });
        });

        beforeEach('Clean user3', function(done) {

          User.update(user3.id, {
            team: null,
            isTeamAdmin: false,
            isAdmin: false
          })
            .then(() => {
              return done();
            });
        });

        after('Removing temporary user', function(done) {

          User.destroy(user3.id)
            .then(() => {
              return AccessToken.destroy({
                token: user3.token
              });
            })
            .then(() => {
              return done();
            });
        });

        it('Admin should be authorized', function(done) {

          User.update(user3.id, {
            isAdmin: true
          })
            .then(() => {
              nano.request(sails.hooks.http.app)
                .post('/api/teams')
                .send({
                  data: {
                    attributes: {
                      name: 'test'
                    }
                  }
                })
                .set('Authorization', 'Bearer ' + user3.token)
                .expect(201);
            })
            .then(() => {
              return Team.destroy({
                name: 'test'
              });
            })
            .then(() => {
              return done();
            });
        });

        it('Regular users should be authorized', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/teams')
            .send({
              data: {
                attributes: {
                  name: 'test'
                }
              }
            })
            .set('Authorization', 'Bearer ' + user3.token)
            .expect(201)
            .then(() => {
              return Team.destroy({
                name: 'test'
              });
            })
            .then(() => {
              return done();
            });
        });

        it('Unauthenticate users token should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/teams')
            .send({
              data: {
                attributes: {
                  name: 'test'
                }
              }
            })
            .expect(401)
            .end(done);
        });
      });

      describe('Update teams - not accessible from the API', function() {

        it('Admin should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .patch('/api/teams/' + team1.id)
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .patch('/api/teams/' + team1.id)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users token should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .patch('/api/teams/' + team1.id)
            .expect(401)
            .end(done);
        });
      });

      describe('Delete teams - not accessible from the API', function() {

        it('Admin should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/teams/' + team1.id)
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });

        it('Regular users should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/teams/' + team1.id)
            .set('Authorization', 'Bearer ' + token)
            .expect(403)
            .end(done);
        });

        it('Unauthenticate users token should be unauthorized', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/teams/' + team1.id)
            .expect(403)
            .end(done);
        });
      });
    });
  });
};
