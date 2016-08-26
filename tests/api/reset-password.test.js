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

/* global sails, ConfigService, User */

var nano = require('./lib/nanotest');
var expect = require('chai').expect;

module.exports = function() {

  describe('Reset password', function() {

    const userEmail = 'user-test@nanocloud.com';

    describe('Create a reset password token', function() {

      before(function(done) {
        ConfigService.set('testMail', true)
          .then(() => {
            return User.create({
              firstName: 'Firstname',
              lastName: 'Lastname',
              email: userEmail,
              password: 'nanocloud',
              isAdmin: false
            });
          })
          .then(() => {
            return done();
          });
      });

      it('Should reset password when clicking the reset link', function(done) {

        return nano.request(sails.hooks.http.app)
          .post('/api/reset-passwords')
          .send({
            data: {
              attributes: {
                email: 'user-test@nanocloud.com'
              },
              type: 'reset-password'
            }
          })
          .expect(200)
          .expect({
            meta: {}
          })
          .then(() => {
            // token has been added to 'reset-password' table
            return global['Reset-password'].findOne({
              email: userEmail
            })
              .then((resetPassword) => {
                expect(resetPassword.email).to.equal('user-test@nanocloud.com');

                return resetPassword.id;
              });
          })
          .then((token) => {

            return nano.request(sails.hooks.http.app)
              .patch('/api/reset-passwords/' + token)
              .send({
                data: {
                  attributes: {
                    password: 'newpassword'
                  },
                  type: 'reset-password'
                }
              })
              .expect(200)
              .expect({
                meta: {}
              });
          })
          .then(() => {

            return nano.request(sails.hooks.http.app)
              .post('/oauth/token')
              .send({
                username: userEmail,
                password: 'newpassword',
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

    after(function(done) {
      ConfigService.unset('testMail')
        .then(() => {
          User.destroy({
            email: userEmail
          })
            .then(() => {
              return done();
            });
        });
    });
  });
};
