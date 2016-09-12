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

/* globals sails, ConfigService */

const nano = require('./lib/nanotest');
const expect = require('chai').expect;

module.exports = function() {

  describe('Storage', function() {

    before((done) => {
      ConfigService.set('storageAddress', 'localhost')
      .then(() => {
        return ConfigService.set('storagePort', 9090);
      })
      .then(() => {
        return done();
      });
    });

    const fileSchema = {
      type: 'object',
      properties: {
        mod_time: {type: 'number'},
        name: {type: 'string'},
        size: {type: 'number'},
        type: {type: 'string'},
      },
      required: ['mod_time', 'name', 'size', 'type'],
      additionalProperties: false
    };

    let filename = 'storage.test.js';
    let fileSize = null;

    describe('Upload a file', function() {
      it('Should upload a file', function(done) {
        nano.request(sails.hooks.http.app)
        .post('/api/upload?filename=' + filename)
        .attach(filename, './tests/api/storage.test.js', filename)
        .set(nano.adminLogin())
        .expect(200)
        .end(done);
      });
    });

    describe('Get user\'s files', function() {
      it('Should return a list of files', function(done) {
        nano.request(sails.hooks.http.app)
        .get('/api/files')
        .set(nano.adminLogin())
        .expect(200)
        .expect(nano.jsonApiSchema(fileSchema))
          .expect((res) => {
            console.log(res.body);
          fileSize = res.body.data[0].attributes.size;
        })
        .end(done);
      });
    });

    describe('Download a file', function() {

      let downloadToken = null;
      describe('Get a download token', function() {
        it('Should return a download token', function(done) {
          nano.request(sails.hooks.http.app)
          .get('/api/files/token?filename=' + filename)
          .set(nano.adminLogin())
          .expect(200)
          .expect((res) => {
            downloadToken = res.body.token;
          })
          .end(done);
        });
      });

      describe('Download file', function() {
        it('Should return file content', function(done) {
          nano.request(sails.hooks.http.app)
          .get('/api/files/download?filename=' + filename + '&token=' + downloadToken)
          .expect(200)
          .expect('Content-Type', 'application/javascript')
          .expect('Content-disposition', `attachment; filename="${filename}"`)
          .expect((res) => {
            expect(res.text.length).to.equal(fileSize);
          })
          .end(done);
        });
      });
    });

    describe('Get user\'s team\'s files', function() {
      it('Should return an empty list (no team)', function(done) {
        nano.request(sails.hooks.http.app)
        .get('/api/files?teams=true')
        .set(nano.adminLogin())
        .expect(200)
        .expect(nano.jsonApiSchema(fileSchema))
        .expect((res) => {
          expect(res.body.data.length).to.equal(0);
        })
        .end(done);
      });
    });
  });
};
