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

/* globals sails */

var nano = require('./lib/nanotest');

module.exports = function() {

  describe('User limitation', function() {

    describe('Create user with in future expiration date', function() {

      it('Should return created user', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/users')
          .send({
            data: {
              attributes: {
                'first-name': 'Future',
                'last-name': 'Date',
                email: 'futuredate@nanocloud.com',
                password: 'nanocloud',
                'is-admin': false,
                'expiration-date': 1543681605
              },
              type: 'users'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .end(done);
      });

      it('Should return valid token', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/oauth/token')
          .send({
            username: 'futuredate@nanocloud.com',
            password: 'nanocloud',
            grant_type: 'password'
          })
        .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
          .expect(200)
          .expect((res) => {
            if (res.body.token_type !== 'Bearer') {
              throw new Error('token_type should be Bearer');
            }
          })
          .end(done);
      });
    });

    describe('Create user with in past expiration date', function() {

      it('Should return created user', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/users')
          .send({
            data: {
              attributes: {
                'first-name': 'Past',
                'last-name': 'Date',
                email: 'pastdate@nanocloud.com',
                password: 'nanocloud',
                'is-admin': false,
                'expiration-date': 1
              },
              type: 'users'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .end(done);
      });

      it('Should return the expired account error message', function(done) {
        nano.request(sails.hooks.http.app)
          .post('/oauth/token')
          .send({
            username: 'pastdate@nanocloud.com',
            password: 'nanocloud',
            grant_type: 'password'
          })
          .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
          .expect(400)
          .expect((res) => {
            if (res.body.error_description !== 'This account is expired') {
              throw new Error('Error message is not appropriate');
            }
          })
          .end(done);
      });
    });
  });
};
