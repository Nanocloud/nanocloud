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

/* global AccessToken,ConfigService,StorageService,User, PlazaService */

const expect = require('chai').expect;

describe('Storage Service', function() {
  before(function(done) {
    ConfigService.set('storageAddress', 'localhost')
    .then(() => {
      ConfigService.set('storagePort', 9090);
    })
    .then(() => {
      ConfigService.set('uploadLimit', 10);
    })
    .then(() => {
      done();
    });
  });

  describe('Find or create a storage', function() {
    it('Should return a Storage', function(done) {
      User.findOne({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      })
      .then((user) => {
        return StorageService.findOrCreate(user);
      })
      .then((storage) => {
        expect(storage.username.length).to.equal(30);
        expect(storage.password.length).to.equal(60);
        expect(storage.hostname).to.equal('localhost');
        expect(storage.port).to.equal('9090');
        expect(storage.user).to.equal('aff17b8b-bf91-40bf-ace6-6dfc985680bb');
        done();
      });
    });
  });

  let filename = 'StorageService.test.js';
  let token = null;
  describe('Create a download token', function() {
    it('Should return a new 1-hour valid download token', function(done) {
      AccessToken.findOne({userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'}, (err, accessToken) => {
        token = StorageService.createToken(accessToken, filename);
        expect(token.split(':').length).to.equal(2);
        done();
      });
    });
  });

  describe('Check a download token', function() {
    it('Should return true or false', function(done) {
      AccessToken.findOne({userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'}, (err, accessToken) => {
        expect(StorageService.checkToken(accessToken, token, filename)).to.equal(true);
        expect(StorageService.checkToken(accessToken, token, '')).to.equal(false);
        expect(StorageService.checkToken(accessToken, '', filename)).to.equal(false);
        expect(StorageService.checkToken(accessToken, '', '')).to.equal(false);
        done();
      });
    });
  });

  describe('Calculate storage size', function() {
    it('Should return sum of files size', function(done) {
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
          PlazaService.upload(storage, file);
          StorageService.storageSize(storage)
            .then((sum) => {
              PlazaService.exec(
                storage.hostname,
                storage.port,
                {
                  username: storage.username,
                  wait: true,
                  command: ['mkdir', '/home/' + storage.username + '/mkdirtest']
                }
              )
                .then(() => {
                  PlazaService.exec(
                    storage.hostname,
                    storage.port,
                    {
                      username: storage.username,
                      wait: true,
                      command: [
                        'cp',
                        '/home/' + storage.username + '/' + filename,
                        '/home/' + storage.username + '/mkdirtest',
                      ]
                    }
                  )
                    .then(() => {
                      expect(sum).to.not.equal(0);
                      StorageService.storageSize(storage)
                        .then((reqsum) => {
                          expect(reqsum).to.be.above(sum);
                          done();
                        });
                    });
                });
            });
        });
    });
  });

  describe('Check upload limit', function() {
    it('Should return promise without error', function(done) {
      return User.findOne({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      })
      .then((user) => {
        return StorageService.findOrCreate(user);
      })
      .then((storage) => {
        return StorageService.checkUploadLimit(storage, 1)
        .then((res) => {
          expect(res).to.equal(null);
          done();
        });
      });
    });

    it('Should return a promise with an error because limit is reached', function(done) {
      return User.findOne({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      })
      .then((user) => {
        return StorageService.findOrCreate(user);
      })
      .then((storage) => {
        return StorageService.checkUploadLimit(storage, 10485761)
        .catch((err) => {
          expect(err.statusCode).to.equal(403);
          expect(err.message).to.equal('The upload limit is reached');
          done();
        });
      });
    });
  });
});
