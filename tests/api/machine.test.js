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

/* globals sails, AccessToken, User, Machine */

var nano = require('./lib/nanotest');

module.exports = function() {

  describe('machine', function() {

    let user = null;
    let token = null;

    before('Add proper user and machines for testing', function(done) {
      User.create({
        firstName: 'Test',
        lastName: 'Test',
        password: 'tests',
        email: 'test@test.com',
        isAdmin: false,
        expirationDate: null,
      })
        .then((res) => {
          user = res;
          return Machine.create({
            user: user.id,
            name: 'essai1',
            type: 'manual',
            ip: '1.1.1.1',
            username: 'Administrator',
            password: 'admin'
          },
          {
            name: 'essai2',
            type: 'manual',
            ip: '2.2.2.2',
            username: 'Administrator',
            password: 'admin'
          });
        })
        .then(() => {
          return AccessToken.create({
            userId: user.id
          });
        })
        .then((res) => {
          token = res;
          return done();
        });
    });

    after('Remove created user and machines', function(done) {
      User.destroy({firstName: 'Test'})
        .then(() => {
          return Machine.destroy({
            name: ['essai1', 'essai2']
          });
        })
        .then(() => done());
    });

    it('Should return user machines', function(done) {
      nano.request(sails.hooks.http.app)
        .get('/api/machines')
        .set('Authorization', 'Bearer ' + token.token)
        .expect(200)
        .expect((res) => {
          if (res.body.data.length !== 1) {
            throw new Error('Regular users should not be able to list all machines');
          }
        })
        .then(() => {
          nano.request(sails.hooks.http.app)
            .get('/api/machines')
            .set(nano.adminLogin())
            .expect(200)
            .expect((res) => {
              if (res.body.data.length <= 1) {
                throw new Error('Admins should be able to list all machines');
              }
            });
        })
        .then(() => {
          nano.request(sails.hooks.http.app)
            .get('/api/machines/users')
            .set('Authorization', 'Bearer ' + token.token)
            .expect(200)
            .expect((res) => {
              if (res.body.data.length !== 1) {
                throw new Error('All users should be able to list only their machines');
              }
            })
            .end(done);
        });
    });
  });
};
