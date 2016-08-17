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
    it('Should return user machines', function(done) {
      User.create({
        'first-name': 'Test',
        'last-name': 'Test',
        password: 'tests',
        email: 'test@test.com',
        isAdmin: false,
        'expiration-date': null,
      })
        .then(() => {
          return Machine.create({
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
          return nano.request(sails.hooks.http.app)
            .post('/oauth/token')
            .send({
              username: 'test@test.com',
              password: 'tests',
              grant_type: 'password'
            })
            .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
            .expect(200);
        })
        .then(() => {
          return User.find({
            'email': 'test@test.com'
          });
        })
        .then((user) => {
          return AccessToken.find({
            userId: user[0].id
          });
        })
        .then((token) => {
          nano.request(sails.hooks.http.app)
            .get('/api/machines')
            .set('Authorization', 'Bearer ' + token[0].token)
            .expect(200)
            .expect((res) => {
              if (res.body.data.length > 1) {
                throw new Error('Normal user should not be able to list all machines');
              }
            });
        })
        .then(() => {
          nano.request(sails.hooks.http.app)
            .get('/api/machines/users')
            .set(nano.adminLogin())
            .expect(200)
            .expect((res) => {
              if (res.body.data.length <= 1) {
                throw new Error('Admin user should be able to list all machines');
              }
            })
            .end(done);
        });
    });
  });
};
