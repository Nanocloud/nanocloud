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

/* globals sails, User, ConfigService, Group, UserGroup */

var nano = require('./lib/nanotest');
var expect = require('chai').expect;
const moment = require('moment');

module.exports = function() {

  describe('Auto sign-up', function() {

    before(function(done) {
      // it takes time to send a mail with nodemailer
      this.timeout(10000);

      ConfigService.set('testMail', true)
        .then(() => {
          return done();
        });
    });

    const expectedSchema = {
      type: 'object',
      properties: {
        'first-name': {type: 'string'},
        'last-name': {type: 'string'},
        'hashed-password': {type: 'string'},
        email: {type: 'string'},
        'is-admin': {type: 'boolean'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'},
      },
      required: ['first-name', 'last-name', 'hashed-password', 'email', 'is-admin', 'created-at', 'updated-at'],
      additionalProperties: true, // expiration days
    };

    const userData = {
      'first-name': 'Firstname',
      'last-name': 'Lastname',
      email: 'signup@nanocloud.com',
      password: 'nanocloud'
    };

    it('Should create an entry in user table', function(done) {

      // adding user to pendinguser table
      nano.request(sails.hooks.http.app)
        .post('/api/pendingusers')
        .send({
          data: {
            attributes: userData,
            type: 'pendingusers'
          }
        })
        .expect(201)
        .then(() => {

          // user has been added to pending user table
          return nano.request(sails.hooks.http.app)
            .get('/api/pendingusers')
            .set(nano.adminLogin())
            .expect(200)
            .expect(nano.jsonApiSchema(expectedSchema))
            .expect((res) => {
              expect(res.body.data[0].attributes['first-name']).to.equal('Firstname');
            });
        })
        .then((res) => {

          // activate user
          return nano.request(sails.hooks.http.app)
            .patch('/api/pendingusers/' + res.body.data[0].id)
            .expect(200)
            .expect(nano.jsonApiSchema(expectedSchema));
        })
        .then(() => {

          // user has been activated
          return nano.request(sails.hooks.http.app)
            .get('/api/users')
            .set(nano.adminLogin())
            .expect(200)
            .expect((res) => {
              expect(res.body.data[1].attributes['first-name']).to.equal('Firstname');
            });
        })
        .then(() => {
          return done();
        });
    });

    it('Should create an entry in user table with an expiration date set', function(done) {

      let expirationDateInConfig = 10;

      ConfigService.set('expirationDate', expirationDateInConfig)
        .then(() => {
          // adding user to pendinguser table
          nano.request(sails.hooks.http.app)
            .post('/api/pendingusers')
            .send({
              data: {
                attributes: userData,
                type: 'pendingusers'
              }
            })
            .expect(201)
            .then((res) => {

              // activate user
              return nano.request(sails.hooks.http.app)
                .patch('/api/pendingusers/' + res.body.data.id)
                .expect(200)
                .expect(nano.jsonApiSchema(expectedSchema));
            })
            .then(() => {

              // user has been activated
              return nano.request(sails.hooks.http.app)
                .get('/api/users')
                .set(nano.adminLogin())
                .expect(200)
                .expect((res) => {
                  let expirationDate = res.body.data[2].attributes['expiration-date'];

                  expect(moment(moment.unix(expirationDate)).diff(new Date(), 'days')).to.equal(expirationDateInConfig - 1);
                });
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Should create an entry in user table with no expiration date set', function(done) {

      ConfigService.set('expirationDate', 0) // A value of 0 means not activated
        .then(() => {
          // adding user to pendinguser table
          nano.request(sails.hooks.http.app)
            .post('/api/pendingusers')
            .send({
              data: {
                attributes: userData,
                type: 'pendingusers'
              }
            })
            .expect(201)
            .then((res) => {

              // activate user
              return nano.request(sails.hooks.http.app)
                .patch('/api/pendingusers/' + res.body.data.id)
                .expect(200)
                .expect(nano.jsonApiSchema(expectedSchema));
            })
            .then(() => {

              // user has been activated
              return nano.request(sails.hooks.http.app)
                .get('/api/users')
                .set(nano.adminLogin())
                .expect(200)
                .expect((res) => {
                  let expirationDate = res.body.data[2].attributes['expiration-date'];

                  expect(expirationDate).to.be.equal(null);
                });
            })
            .then(() => {

              return nano.request(sails.hooks.http.app)
                .post('/oauth/token')
                .send({
                  username: userData.email,
                  password: userData.password,
                  grant_type: 'password'
                })
                .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
                .expect(200);
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Should prevent from creating the same user twice', function(done) {

      nano.request(sails.hooks.http.app)
        .post('/api/pendingusers')
        .send({
          data: {
            attributes: userData,
            type: 'pendingusers'
          }
        })
        .expect(201)
        .then(() => {
          return nano.request(sails.hooks.http.app)
            .post('/api/pendingusers')
            .send({
              data: {
                attributes: userData,
                type: 'pendingusers'
              }
            })
            .expect(400);
        })
        .then(() => {
          return done();
        });

    });

    describe('Signup user should be assigned the default group if any', function() {

      const userData = {
        'first-name': 'Firstname',
        'last-name': 'Lastname',
        email: 'signup2@nanocloud.com',
        password: 'nanocloud'
      };

      let groupId = null;

      before('Create default group', function(done) {

        Group.create({
          name: 'Test group'
        })
          .then((group) => {
            groupId = group.id;
            return ConfigService.set('defaultGroup', groupId);
          })
          .then(() => {
            return done();
          });
      });

      after('Remove default group', function(done) {

        Group.destroy({
          name: 'Test group'
        })
          .then(() => {
            return ConfigService.set('defaultGroup', '');
          })
          .then(() => {
            return User.destroy({
              email: userData.email
            });
          })
          .then(() => {
            return done();
          });
      });

      it('should assign default group for user', function(done) {
        nano.request(sails.hooks.http.app)
          .post('/api/pendingusers')
          .send({
            data: {
              attributes: userData,
              type: 'pendingusers'
            }
          })
          .expect(201)
          .then((res) => {
            // activate user
            return nano.request(sails.hooks.http.app)
              .patch('/api/pendingusers/' + res.body.data.id)
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema));
          })
          .then((res) => {
            return UserGroup.find({
              user: res.body.data.id
            })
              .then((usergroup) => {
                expect(usergroup[0].group).to.equal(groupId);
              });
          })
          .then(() => {
            return done();
          });
      });
    });

    after(function(done) {
      ConfigService.unset('testMail')
        .then(() => {
          return done();
        });
    });

    afterEach(function(done) {
      User.destroy({
        email: userData.email
      })
        .then(() => {
          return done();
        });
    });
  });
};
