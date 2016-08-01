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

/* globals Storage, ConfigService */

const randomstring = require("randomstring");
const sha1 = require("sha1");

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
          'user': user.id
        }, {
          user: user,
          username: randomstring.generate({
            length: 30,
            charset: 'alphabetic',
            capitalization: 'lowercase',
          }),
          password: randomstring.generate(60),
          hostname: configs['storageAddress'],
          port: configs['storagePort']
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

    return accessToken.id + ":" + sha1(accessToken.token + ":" + filename + ":" + timeStone);
  },

  /**
   * checkToken
   *
   * Check wether a download token is valid or not
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
  }
};
