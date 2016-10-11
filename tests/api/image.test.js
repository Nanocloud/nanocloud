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
/* globals sails, Machine, Image */

var nano = require('./lib/nanotest');
var chai = require('chai');
var expect = chai.expect;

module.exports = function() {
  describe('Images', function() {

    var defaultImageId = null;
    var anotherImageId = null;
    var baseMachineId = null;

    it('Should exist a single default image', function(done) {

      nano.request(sails.hooks.http.app)
        .get('/api/images')
        .set(nano.adminLogin())
        .expect(200)
        .expect((res) => {
          expect(res.body.data).to.have.length(1);
        })
        .then((res) => {
          let imageData = res.body.data.pop();

          expect(imageData.attributes.name).to.be.equal('Default');
          expect(imageData.attributes['build-from']).to.be.equal(null);

          defaultImageId = imageData.id;
          return done();
        });
    });

    it('Should be possible to save an image', function(done) {

      Machine.findOne({
        image: defaultImageId
      })
        .then((machine) => {
          baseMachineId = machine.id;
          nano.request(sails.hooks.http.app)
            .post('/api/images')
            .set(nano.adminLogin())
            .send({
              data: {
                attributes: {
                  'build-from': baseMachineId,
                },
                type: 'images'
              }
            })
            .expect(201)
            .then((res) => {
              let image = res.body.data;
              anotherImageId = image.id;

              expect(image.attributes.deleted).to.be.equal(false);
              expect(image.attributes['build-from']).to.be.equal(machine.id);
              return done();
            });
        });
    });

    it('Should exist two images now', function(done) {

      nano.request(sails.hooks.http.app)
        .get('/api/images')
        .set(nano.adminLogin())
        .expect(200)
        .expect((res) => {
          expect(res.body.data).to.have.length(2);
        })
        .then((res) => {

          res.body.data.forEach((imageData) => {
            let image = imageData.attributes;

            if (image.name === 'Default') {
              expect(image['build-from']).to.be.equal(null);
            } else {
              expect(image['build-from']).to.be.equal(baseMachineId);
            }
          });
          return done();
        });
    });

    it('Should delete an image', function(done) {

      nano.request(sails.hooks.http.app)
        .delete('/api/images/' + anotherImageId)
        .set(nano.adminLogin())
        .expect(202)
        .then(() => {
          return Image.find({
            deleted: false
          });
        })
        .then((images) => {
          expect(images.length).to.be.equal(1);
          expect(images[0].buildFrom).to.be.equal(null);
          return done();
        });
    });

  });
};
