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
// global: ConfigService

var nano = require('./lib/nanotest');
var expect = require('chai').expect;

module.exports = function() {

  describe("Reset password", function() {

    before(function() {
      ConfigService.set('testSendMail', true);
    });

    const expectedSchema = {};

    describe("Create a reset password token", function() {

      it('Should return empty meta', function(done) {

        // create user for testing
        nano.request(sails.hooks.http.app)
        .post('/api/users')
        .send({
          data: {
            attributes: {
              'first-name': "Firstname",
              'last-name': "Lastname",
              'email': "user-test@nanocloud.com",
              'password': "nanocloud",
              'is-admin': false
            },
            type: 'users'
          }
        })
        .set(nano.adminLogin())
        .expect(201)

        // test token creation
        .then(() => {
          // adding token to 'reset-password' table
          nano.request(sails.hooks.http.app)
          .post('/api/reset-passwords')
          .send({
            data: {
              attributes: {
                'email': "user-test@nanocloud.com",
                'password': null,
              },
              type: 'reset-password'
            }
          })
          .set(nano.adminLogin())
          .expect(200)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then(() => {
            // token has been added to 'reset-password' table
            return (nano.request(sails.hooks.http.app)
              .get('/api/reset-passwords')
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect((res) => {
                expect(res.body.data[0].attributes["email"])
                  .to.equal('user-test@nanocloud.com');
              })
            );
          });
        })
        .then(() => {
          return done(); 
        })
      });
    });

    after(function() {
      ConfigService.unset('testSendMail');
    });
  });
};
