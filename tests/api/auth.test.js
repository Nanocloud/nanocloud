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

var nano = require('./lib/nanotest');

module.exports = function() {

  describe('Authentication', function() {
    describe('Login', function() {

      const expectedSchema = {
        type: 'object',
        properties: {
          access_token: {type: 'string'},
          refresh_token: {type: 'string'},
          token_type: {'type': 'string'},
          expires_in: {type: 'integer'}
        },
        required: ['access_token', 'refresh_token', 'token_type', 'expires_in'],
        additionalProperties: false
      };

      it('Should return token from valid username/password', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/oauth/token')
          .send({
            "username": "admin@nanocloud.com",
            "password": "admin",
            "grant_type": "password"
          })
          .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
          .expect(200)
          .expect(nano.schema(expectedSchema))
          .expect((res) => {
            if (res.body.token_type !== 'Bearer') {
              throw new Error("token_type should be Bearer");
            }
          })
          .end(done);
      });

      const expectedErrorSchema = {
        type: 'object',
        properties: {
          error: {type: 'string'},
          error_description: {type: 'string'}
        },
        required: ['error', 'error_description'],
        additionalProperties: false
      };

      it('Should reject login with invalid username/password', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/oauth/token')
          .send({
            "username": "fake@nanocloud.com",
            "password": "admin",
            "grant_type": "password"
          })
          .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
          .expect(400)
          .expect(nano.schema(expectedErrorSchema))
          .end(done);
      });
    });

    describe('Reject unauthorized', function() {

      it("Should reject unauthenticated users on /api/*", function(done) {

        nano.request(sails.hooks.http.app)
          .get('/api/users')
          .expect(401)
          .expect(function backendToRespondWithUnauthorized(res) {
            if (res.text !== 'Unauthorized') {
              throw new Error("API should respond with 401 Unauthorized if someone try to access /api/* with no access token");
            }
          })
          .end(done);
      });

      it("Should allow authorized user to get his profile", function(done) {

        nano.request(sails.hooks.http.app)
          .get('/api/users')
          .set('Authorization', 'Bearer admintoken')
          .expect(200)
          .expect(nano.isJsonApi)
          .end(done);
      });
    });
  });
};
