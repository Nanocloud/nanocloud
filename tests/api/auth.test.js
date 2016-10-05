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

/* globals sails, AccessToken, RefreshToken, User, ConfigService */

var nano = require('./lib/nanotest');
const Promise = require('bluebird'),
  activedirectory = require('activedirectory');

module.exports = function() {

  describe('Classic authentication', function() {
    describe('Login', function() {

      const expectedSchema = {
        type: 'object',
        properties: {
          access_token: {type: 'string'},
          refresh_token: {type: 'string'},
          token_type: {type: 'string'},
          expires_in: {type: 'integer'}
        },
        required: ['access_token', 'refresh_token', 'token_type', 'expires_in'],
        additionalProperties: false
      };

      it('Should return token from valid username/password', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/oauth/token')
          .send({
            username: 'admin@nanocloud.com',
            password: 'admin',
            grant_type: 'password'
          })
          .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
          .expect(200)
          .expect(nano.schema(expectedSchema))
          .expect((res) => {
            if (res.body.token_type !== 'Bearer') {
              throw new Error('token_type should be Bearer');
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
            username: 'fake@nanocloud.com',
            password: 'admin',
            grant_type: 'password'
          })
          .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
          .expect(400)
          .expect(nano.schema(expectedErrorSchema))
          .end(done);
      });
    });

    describe('Reject unauthorized', function() {

      it('Should reject unauthenticated users on /api/*', function(done) {

        nano.request(sails.hooks.http.app)
          .get('/api/users')
          .expect(401)
          .expect({
            error: 'access_denied',
            error_description: 'Invalid User Credentials',
            status: 401
          })
          .end(done);
      });

      it('Should allow authorized user to get his profile', function(done) {

        nano.request(sails.hooks.http.app)
          .get('/api/users')
          .set(nano.adminLogin())
          .expect(200)
          .expect(nano.isJsonApi)
          .end(done);
      });
    });
  });

  describe('LDAP authentication', function() {
    describe('Login', function() {
      const adAuthenticate = activedirectory.prototype.authenticate;
      const adFindUser = activedirectory.prototype.findUser;
      before(function(done) {
        ConfigService.set('ldapActivated', true)
          .then(() => {
            activedirectory.prototype.authenticate = function(username, password, callback) {
              if (username === 'jdoe@nanocloud.com' && password === 'Nanocloud123+') {
                return callback(null, true);
              }
              let err = 'Wrong username or password';
              return callback(err, false);
            };
            activedirectory.prototype.findUser = function(username, callback) {
              if (username !== 'jdoe@nanocloud.com') {
                let err = 'User ' + username + ' not found';
                return callback(err, null);
              }
              let user = {
                givenName: 'John',
                sn: 'Doe'
              };
              return callback(null, user);
            };
            return done();
          });
      });

      const expectedSchema = {
        type: 'object',
        properties: {
          access_token: {type: 'string'},
          refresh_token: {type: 'string'},
          token_type: {type: 'string'},
          expires_in: {type: 'integer'}
        },
        required: ['access_token', 'refresh_token', 'token_type', 'expires_in'],
        additionalProperties: false
      };

      it('Should return token from valid username/password', function(done) {
        nano.request(sails.hooks.http.app)
          .post('/oauth/token')
          .send({
            username: 'jdoe@nanocloud.com',
            password: 'Nanocloud123+',
            grant_type: 'password'
          })
          .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
          .expect(200)
          .expect(nano.schema(expectedSchema))
          .expect((res) => {
            if (res.body.token_type !== 'Bearer') {
              throw new Error('token_type should be Bearer');
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
            username: 'jdoe',
            password: 'Nanocloud123+',
            grant_type: 'password'
          })
          .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
          .expect(400)
          .expect(nano.schema(expectedErrorSchema))
          .end(done);
      });

      after(function(done) {
        activedirectory.prototype.authenticate = adAuthenticate;
        activedirectory.prototype.findUser = adFindUser;
        return done();
      });
    });

    describe('Reject unauthorized', function() {

      it('Should reject unauthenticated users on /api/*', function(done) {

        nano.request(sails.hooks.http.app)
          .get('/api/users')
          .expect(401)
          .expect({
            error: 'access_denied',
            error_description: 'Invalid User Credentials',
            status: 401
          })
          .end(done);
      });

      it('Should allow authorized user to get his profile', function(done) {

        nano.request(sails.hooks.http.app)
          .get('/api/users')
          .set(nano.adminLogin())
          .expect(200)
          .expect(nano.isJsonApi)
          .end(done);
      });
    });
  });

  describe('Logout', function() {
    it('Should destroy refresh and access token of the user', function(done) {
      User.create({
        'first-name': 'revokeToken',
        'last-name': 'tokenRevoke',
        email: 'revoke@token.com',
        password: 'revokeToken',
        'is-admin': false,
        'expiration-date': null
      })
        .then(() => {
          return nano.request(sails.hooks.http.app)
            .post('/oauth/token')
            .send({
              username: 'revoke@token.com',
              password: 'revokeToken',
              grant_type: 'password'
            })
            .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
            .expect(200);
        })
        .then(() => {
          return User.findOne({
            email: 'revoke@token.com'
          });
        })
        .then((user) => {
          return AccessToken.findOne({
            userId: user.id
          });
        })
        .then((auth) => {
          return nano.request(sails.hooks.http.app)
            .post('/oauth/revoke')
            .send({
              token_type_hint: 'access_token',
              token: auth.token.toString()
            })
            .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
            .expect(200);
        })
        .then(() => {
          return User.findOne({
            email: 'revoke@token.com'
          });
        })
        .then((user) => {
          return RefreshToken.findOne({
            userId: user.id
          });
        })
        .then((auth) => {
          return nano.request(sails.hooks.http.app)
            .post('/oauth/revoke')
            .send({
              token_type_hint: 'refresh_token',
              token: auth.token.toString()
            })
            .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
            .expect(200);
        })
        .then(() => {
          return User.findOne({
            email: 'revoke@token.com'
          });
        })
        .then((user) => {
          return Promise.props({
            access: AccessToken.find({
              userId: user.id
            }),
            refresh: RefreshToken.find({
              userId: user.id
            })
          });
        })
        .then((res) => {
          if (res.access.length !== 0) {
            throw new Error('Access Token should be deleted');
          } else if (res.refresh.length !== 0) {
            throw new Error('Refresh Token should be deleted');
          } else {
            User.destroy({
              email: 'revoke@token.com'
            })
              .then(() => {
                done();
              });
          }
        })
        .catch((err) => {
          throw new Error(err);
        });
    });
  });
};
