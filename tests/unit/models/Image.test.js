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

/* globals App, Image, MachineService, Machine */

const adminId = 'aff17b8b-bf91-40bf-ace6-6dfc985680bb';
const chai = require('chai');
const expect = chai.expect;
const Promise = require('bluebird');

describe('Images', () => {

  describe('Creating an image', function() {

    let defaultImage = null;

    before('Create test app to associate to default image', function(done) {
      Image.findOne({
        deleted: false
      })
        .then((image) => {
          defaultImage = image;
          return App.create({
            alias: 'app1',
            displayName: 'app1',
            filePath: 'C:\\fake.exe',
            state: null,
            image: defaultImage.id
          });
        })
        .then(() => done());
    });

    after('Removing default app', function(done) {
      App.destroy({
        alias: 'app1'
      })
        .then(() => {
          return Image.findOne({
            name: 'Parent image'
          });
        })
        .then((image) => {
          return Machine.destroy()
            .then(() => {
              return App.destroy({image: image.id});
            });
        })
        .then(() => {
          return Image.update({ name: 'Parent image' }, {deleted: true});
        })
        .then(() => done());
    });

    it('Should duplicate parent\'s applications when creating a new image', function(done) {

      MachineService.getMachineForUser({
        id: adminId
      }, {
        id: defaultImage.id
      })
        .then((machine) => {
          return MachineService.createImage({
            buildFrom: machine.id,
            name: 'Parent image'
          });
        })
        .then((image) => {
          return Promise.props({
            defaultImage: Image.findOne(defaultImage.id).populate('apps'),
            newImage: Image.findOne(image.id).populate('apps')
          });
        })
        .then(({defaultImage, newImage}) => {
          expect(newImage.apps).to.have.length(2);

          let application = newImage.apps[0];
          if (application.alias === 'Desktop') {
            application = newImage.apps[1];
          }
          expect(application.alias).to.be.equal('app1');
          expect(application.filePath).to.be.equal('C:\\fake.exe');
        })
        .then(() => {
          return done();
        });
    });
  });
});
