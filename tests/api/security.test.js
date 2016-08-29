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

/* globals sails, User, AccessToken, MachineService */

const nano = require('./lib/nanotest');

module.exports = function() {

  describe('Security', function() {

    let token = null;

    before('Generate a regular user and a token', function(done) {
      User.create({
        firstName: 'Test',
        lastName: 'Test',
        password: 'tests',
        email: 'test@test.com',
        isAdmin: false,
        expirationDate: null,
      })
        .then((user) => {
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
  });
};
