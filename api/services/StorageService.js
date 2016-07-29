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

/* globals Storage */
/* globals ConfigService */

const randomstring = require("randomstring");

module.exports = {

  _initialized: true,

  /**
   * findOrCreate
   *
   * Find or create a user storage in database
   *
   * @user {user}
   * @return {UserStorage}
   */

  findOrCreate: function(user, callback) {
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
      hostname: ConfigService.get("storageAddress")
      }
    )
      .then((storage) => {
        return callback(null, storage);
      })
      .catch((err) => {
        return callback(err);
      });
  }
};
