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
var expect = require('chai').expect;

module.exports = function() {

  describe("Auto sign-up", function() {

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
        'email': {type: 'string'},
        'is-admin': {type: 'boolean'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'},
      },
      required: ['first-name', 'last-name', 'hashed-password', 'email', 'is-admin', 'created-at', 'updated-at'],
      additionalProperties: true, // expiration days
    };

    const userData = {
      'first-name': "Firstname",
      'last-name': "Lastname",
      'email': "signup@nanocloud.com",
      'password': "nanocloud"
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
      .set(nano.adminLogin())
      .expect(201)
      .then((res) => {

        // user has been added to pending user table
        return nano.request(sails.hooks.http.app)
          .get('/api/pendingusers')
          .set(nano.adminLogin())
          .expect(200)
          .expect(nano.jsonApiSchema(expectedSchema))
          .expect((res) => {
            expect(res.body.data[0].attributes["first-name"]).to.equal('Firstname');
          })
      })
      .then((res) => {

        // activate user
        return nano.request(sails.hooks.http.app)
          .patch('/api/pendingusers/' + res.body.data[0].id)
          .set(nano.adminLogin())
          .expect(200)
          .expect(nano.jsonApiSchema(expectedSchema))
      })
      .then((res) => {

        // user has been activated
        return nano.request(sails.hooks.http.app)
          .get('/api/users')
          .set(nano.adminLogin())
          .expect(200)
          .expect((res) => {
            expect(res.body.data[1].attributes["first-name"]).to.equal('Firstname');
          })
      })
      .then(() => {
        return done(); 
      })
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
      .expect(400)
      .end(done);
    });

    after(function(done) {
      ConfigService.unset('testMail');
      User.destroy({
        "email": userData["email"]
      })
      .then(() => {
        return done();
      });
    });
  })
};
