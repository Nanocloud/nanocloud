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

/* global ConfigService */

/**
 * @module hooks
 * @class Config
 * @param {Object} sails The sails application
 */
function Config(sails) {
  return {

    /**
     * Initialize the hook
     *
     * @method initialize
     * @param {Function} done Callback of the initialization
     */
    initialize(done) {
      sails.after('hook:orm:loaded', () => {
        ConfigService.init()
        .then(() => {
          sails.emit('hook:config:loaded');
          done();
        })
        .catch((err) => {
          if (err) {
            sails.log.error('Fail to initialize config.');
            done(err);
          }
        });
      });
    }
  };
}

module.exports = Config;
