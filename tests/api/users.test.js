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

/* globals sails, User */

var nano = require('./lib/nanotest');

module.exports = function() {

  describe('Users', function() {

    const expectedSchema = {
      type: 'object',
      properties: {
        email: {type: 'string'},
        'is-admin': {type: 'boolean'},
        'first-name': {type: 'string'},
        'last-name': {type: 'string'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'}
      },
      required: ['email', 'is-admin', 'first-name', 'last-name', 'created-at', 'updated-at'],
      additionalProperties: true // expiration date is not mandatory
    };

    describe('Create user', function() {

      it('Should return created user', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/users')
          .send({
            data: {
              attributes: {
                'first-name': 'Firstname',
                'last-name': 'Lastname',
                email: 'user@nanocloud.com',
                password: 'nanocloud',
                'is-admin': false,
                'expiration-date': null
              },
              type: 'users'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .end(done);
      });
    });

    describe('List users', function() {
      it('Should return user list as admin', function(done) {

        nano.request(sails.hooks.http.app)
          .get('/api/users')
          .set(nano.adminLogin())
          .expect(200)
          .expect(nano.jsonApiSchema(expectedSchema))
          .end(done);
      });
    });

    describe('Change password', function () {
      it('Should change password', function(done) {
        User.find({
          email: 'user@nanocloud.com'
        })
          .then((user) => {
            return nano.request(sails.hooks.http.app)
              .patch('/api/users/' + user[0].id)
              .send({
                data: {
                  attributes: {
                    email: 'user@nanocloud.com',
                    'first-name': 'Firstname',
                    'last-name': 'Lastname',
                    'is-admin': true,
                    'expiration-date': null,
                    password: 'essai'
                  },
                  type: 'users',
                  id: user[0].id,
                }
              })
              .set(nano.adminLogin())
              .expect(200);
          })
          .then(() => {
            nano.request(sails.hooks.http.app)
              .post('/oauth/token')
              .send({
                username: 'user@nanocloud.com',
                password: 'essai',
                grant_type: 'password'
              })
              .set('Authorization', 'Basic ' + new Buffer('9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae:9050d67c2be0943f2c63507052ddedb3ae34a30e39bbbbdab241c93f8b5cf341').toString('base64'))
              .expect(200, done);
          });
      });
    });
  });
};
