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

/* globals Storage, ConfigService, PlazaService */

const randomstring = require('randomstring');
const sha1 = require('sha1');
const Promise = require('bluebird');

module.exports = {

  _initialized: true,

  /**
   * findOrCreate
   *
   * Find or create a user storage in database
   *
   * @param {Object} user whose storage belong to
   * @return {Promise} Resolves to user's Storage
   */
  findOrCreate: function(user) {
    return ConfigService.get('storageAddress', 'storagePort')
      .then((configs) => {
        return Storage.findOrCreate({
          user: user.id
        }, {
          user: user,
          username: randomstring.generate({
            length: 30,
            charset: 'alphabetic',
            capitalization: 'lowercase',
          }),
          password: randomstring.generate(60),
          hostname: configs.storageAddress,
          port: configs.storagePort
        });
      });
  },

  /**
   * createToken
   *
   * Create a 1-hour valid token to download a specific file
   *
   * @param {Object} User's access token
   * @param {String} Filename to download
   * @return {String} Download token to return to users
   */
  createToken: function(accessToken, filename) {

    let timestamp = Date.now() / 1000;
    let timeStone = timestamp + (3600 - timestamp % 3600);

    return accessToken.id + ':' + sha1(accessToken.token + ':' + filename + ':' + timeStone);
  },

  /**
   * checkToken
   *
   * Check whether a download token is valid or not
   *
   * @param {Object} User's access token
   * @param {String} Download token specified by users in request
   * @param {String} Filename to download
   * @return {Boolean} True if downloadToken is valid, false in other cases
   */
  checkToken: function(accessToken, downloadToken, filename) {

    let expectedToken = this.createToken(accessToken, filename);
    if (expectedToken === downloadToken) {
      return true;
    }
    return false;
  },

  /**
   * checkUploadLimit
   *
   * Check if the upload limit is reached
   *
   * @param {Object} Storage of user want to upload
   * @param {number} Length in byte of the new file
   * @return {Promise[object|null]} Error object if upload limit is reached, null in other cases
   */
  checkUploadLimit: function(storage, length) {
    return ConfigService.get('uploadLimit')
      .then((limit) => {
        return this.storageSize(storage, '', length)
          .then((size) => {
            return new Promise(function(resolve, reject) {
              // limit['uploadLimit'] is in MB
              if (limit.uploadLimit !== 0 && size > limit.uploadLimit * 1048576) {
                return reject({
                  statusCode: 403,
                  message: 'The upload limit is reached'
                });
              }
              return resolve(null);
            });
          });
      });
  },

  /**
   * storageSize
   *
   * Calculate sum of files size recursively
   *
   * @param {Object} Storage of user want to upload
   * @param {string} Directory where we search files
   * @param {number} Sum of files size
   * @return {number} Sum of files size
   */
  storageSize: function(storage, dir, sum) {
    return PlazaService.files(storage, '/home/' + storage.username + '/' + dir)
      .then((files) => {
        return new Promise(function(resolve) {
          for (let i = 0; i < files.data.length; i++) {
            if (files.data[i].attributes.type === 'directory') {
              sum += this.storageSize(storage, files.data[i].attributes.name + '/' + dir, 0);
            } else {
              sum += files.data[i].attributes.size;
            }
          }
          return resolve(sum);
        });
      });
  }
};
