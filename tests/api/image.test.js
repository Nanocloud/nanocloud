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
/* globals sails, MachineService */

var nano = require('./lib/nanotest');
var chai = require('chai');
var expect = chai.expect;

module.exports = function() {
  describe('Images', function() {

    it('Should exist a single default image', function(done) {

      nano.request(sails.hooks.http.app)
        .get('/api/images')
        .set(nano.adminLogin())
        .expect(200)
        .expect((res) => {
          expect(res.body.data).to.have.length(1);
        })
        .then((res) => {
          let image = res.body.data.pop().attributes;

          expect(image.name).to.be.equal('Default');
          expect(image['build-from']).to.be.equal(null);
          return done();
        });
    });

    it('Should be possible to save an image', function(done) {

      MachineService.getMachineForUser({
        id: nano.adminId()
      })
        .then((userMachine) => {
          nano.request(sails.hooks.http.app)
            .post('/api/images')
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  'build-from': userMachine.id
                },
                type: 'images'
              }
            })
            .expect(201)
            .then((res) => {
              let image = res.body.data;

              expect(image.attributes.default).to.be.equal(true);
              expect(image.attributes['build-from']).to.be.equal(userMachine.id);
              return done();
            });
        });
    });
  });
};
