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

/* globals sails, AccessToken, User, Image, Machine, MachineService */

var chai = require('chai');
var expect = chai.expect;
var Promise = require('bluebird');
var nano = require('./lib/nanotest');

module.exports = function() {

  describe('Machine', function() {

    let user = null;
    let token = null;
    let machineId = null;
    let imageId = null;

    before('Add proper user and machines for testing', function(done) {

      Image.findOne({
        deleted: false
      })
        .then((image) => {
          imageId = image.id;
          return Promise.props({
            newUser: User.create({
              firstName: 'Test',
              lastName: 'Test',
              password: 'tests',
              email: 'test@test.com',
              isAdmin: false,
              expirationDate: null
            }),
            newImage: Image.create({
              buildFrom: machineId,
              name: 'AnotherImage'
            })
          });
        })
        .then(({newUser, newImage}) => {
          user = newUser;
          return Machine.create({
            users: [user],
            name: 'essai1',
            type: 'manual',
            ip: '1.1.1.1',
            status: 'running',
            image: imageId,
            username: 'Administrator',
            password: 'admin'
          })
            .then((machine) => {
              machineId = machine.id;
              return Machine.create({
                name: 'essai2',
                type: 'manual',
                ip: '2.2.2.2',
                status: 'running',
                username: 'Administrator',
                image: newImage.id,
                password: 'admin'
              });
            });
        })
        .then(() => {
          return AccessToken.create({
            userId: user.id
          });
        })
        .then((res) => {
          token = res;
          return done();
        });
    });

    after('Remove created user and machines', function(done) {
      User.destroy({firstName: 'Test'})
        .then(() => {
          return Machine.destroy({
            name: ['essai1', 'essai2']
          });
        })
        .then(() => {
          return Image.findOne({
            name: 'AnotherImage'
          });
        })
        .then((image) => {
          return Machine.destroy({
            image: image.id
          });
        })
        .then(() => {
          return Image.destroy({
            name: 'AnotherImage'
          });
        })
        .then(() => done());
    });

    it('Should return user machines', function(done) {
      nano.request(sails.hooks.http.app)
        .get('/api/machines')
        .set('Authorization', 'Bearer ' + token.token)
        .expect(200)
        .expect((res) => {
          if (res.body.data.length !== 1) {
            throw new Error('Regular users should not be able to list all machines');
          }
        })
        .then(() => {
          nano.request(sails.hooks.http.app)
            .get('/api/machines')
            .set(nano.adminLogin())
            .expect(200)
            .expect((res) => {
              if (res.body.data.length <= 1) {
                throw new Error('Admins should be able to list all machines');
              }
            });
        })
        .then(() => {
          nano.request(sails.hooks.http.app)
            .get('/api/machines/users?image=' + imageId)
            .set('Authorization', 'Bearer ' + token.token)
            .expect(200)
            .expect((res) => {
              if (res.body.data.length !== 1) {
                throw new Error('All users should be able to list only their machines');
              }
            })
            .end(done);
        });
    });

    it('Should return the same machine if asking twice', function(done) {
      nano.request(sails.hooks.http.app)
        .get('/api/machines/users?image=' + imageId)
        .set('Authorization', 'Bearer ' + token.token)
        .expect(200)
        .expect((res) => {
          expect(res.body.data[0].id).to.equal(machineId);
        })
        .end(done);
    });

    it('Should return a new machine when asking for a new image', function(done) {

      Image.findOne({
        name: 'AnotherImage'
      })
        .then((image) => {
          return MachineService.getMachineForUser(user, image);
        })
        .then((machine) => {
          nano.request(sails.hooks.http.app)
            .get('/api/machines/users?image=' + machine.image)
            .set('Authorization', 'Bearer ' + token.token)
            .expect(200)
            .expect((res) => {
              expect(res.body.data[0].id).to.not.equal(machineId);
            })
            .end(done);
        });
    });
  });
};
