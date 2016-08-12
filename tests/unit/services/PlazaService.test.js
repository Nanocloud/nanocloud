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

/* global ConfigService, PlazaService, StorageService, User */

const expect = require('chai').expect;
const filename = 'PlazaService.test.js';
var filesize = 0;

describe('PlazaService', function() {

  before(function(done) {
    ConfigService.set('storageAddress', 'localhost')
    .then(() => {
      return ConfigService.set('storagePort', 9090);
    })
    .then(() => {
      return done();
    });
  });

  describe('Exec simple command', function() {
    it('Should return success', (done) => {
      return PlazaService.exec('localhost', 9090, ['ls', '-l'], '')
      .then((res) => {
        expect(res.success).to.equal(true);
        done();
      });
    });
  });

  describe('Upload a file', function() {
    it('Should upload file', (done) => {

      User.findOne({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      })
      .then((user) => {
        return StorageService.findOrCreate(user);
      })
      .then((storage) => {
        let file = {
          filename: filename,
          fd: './tests/unit/services/' + filename
        };
        return PlazaService.upload(storage, file);
      })
      .then((res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-length']).to.equal('0');
        done();
      });
    });
  });

  describe('List files', function() {
    it('Should return a list of file', (done) => {

      User.findOne({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      })
      .then((user) => {
        return StorageService.findOrCreate(user);
      })
      .then((storage) => {
        return PlazaService.files(storage, '/home/' + storage.username);
      })
      .then((files) => {
        expect(files.data.length).to.equal(1);

        let file = files.data[0];
        expect(file.attributes.name).to.equal(filename);

        filesize = files.data[0].attributes.size;
        done();
      });
    });
  });

  describe('Download a file', function() {
    it('Should return content of file', (done) => {

      User.findOne({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      })
      .then((user) => {
        return StorageService.findOrCreate(user);
      })
      .then((storage) => {
        return PlazaService.download(storage, '/home/' + storage.username + '/' + filename);
      })
      .then((res) => {
        expect(res.headers['content-type']).to.equal('application/javascript');
        expect(res.headers['content-disposition']).to.equal('attachment; filename=' + filename + '');
        expect(res.headers['content-length']).to.equal(filesize.toString());
        done();
      });
    });
  });
});
