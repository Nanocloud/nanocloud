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

/* globals sails, User, AccessToken, MachineService, Group */
/* globals ConfigService, StorageService */

const nano = require('./lib/nanotest');

module.exports = function() {

  describe('Security', function() {

    let token = null;
    let groupId = null;
    let storageId = null;
    let filename = 'security.test.js';
    let downloadToken = null;
    let image = null;

    before('Generate a regular user, a token, a group and storage', function(done) {
      User.create({
        firstName: 'Test',
        lastName: 'Test',
        password: 'tests',
        email: 'test@test.com',
        isAdmin: false,
        expirationDate: null,
      })
        .then((user) => {
          StorageService.findOrCreate(user)
            .then((storage) => {
              storageId = storage.id;
            });
          return AccessToken.create({
            userId: user.id
          });
        })
        .then((res) => {
          token = res.token;
          return Group.create({
            name: 'group'
          });
        })
        .then((res) => {
          groupId = res.id;
          return done();
        });
    });

    after('Delete created user', function(done) {
      User.destroy({
        email: 'test@test.com'
      })
        .then(() => done());
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

    describe('Group', function() {

      describe('Create group - Only possible for admins', function() {

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

      describe('Read group - Only possible for admins', function() {

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

      describe('Read one group - Only possible for admins', function() {

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
    });

    describe('Update group', function() {

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

    describe('Delete config - forbidden for regular users', function() {
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

    describe('Storage', function() {

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

      describe('Download a file - available only with a valid download token with authorization or not', function() {

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

      let adminPendingUser = null;
      let ruPendingUser = null;
      let nologPendingUser = null;

      before(function(done) {
        // it takes time to send a mail with nodemailer
        this.timeout(10000);

        ConfigService.set('testMail', true)
          .then(() => {
            return done();
          });
      });

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
            .expect((res) => {
              adminPendingUser = res.body.data.id;
            })
            .expect(201)
            .end(done);
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
            .expect((res) => {
              ruPendingUser = res.body.data.id;
            })
            .expect(201)
            .end(done);
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
            .expect((res) => {
              nologPendingUser = res.body.data.id;
            })
            .expect(201)
            .end(done);
        });
      });

      describe('Get all pending users - Available for logged in user', function() {

        it('Admins should be authorized to get all pending users', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/pendingusers')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized to get all pending users', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/pendingusers')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
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
            .patch('/api/pendingusers/' + adminPendingUser)
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });

        it('Regular users should be authorized to activate a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/pendingusers/' + ruPendingUser)
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(done);
        });

        it('Not logged in user should be authorized to activate a pending user', function(done) {
          return nano.request(sails.hooks.http.app)
            .patch('/api/pendingusers/' + nologPendingUser)
            .expect(200)
            .end(done);
        });
      });
    });

    describe('Images', function() {

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

      describe('Get a property - available for all users even not logged in user', function() {

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
  });
};
