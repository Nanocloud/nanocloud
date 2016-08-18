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
  });
};
