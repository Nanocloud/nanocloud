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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global MachineService */

/**
 * Initialize the MachineService
 *
 * @module hooks
 * @class Driver
 * @param {Object} sails The sails application
 */
function Driver(sails) {
  return {

    /**
     * Initialize the driver hook
     *
     * @method initialize
     * @param {Function} callback The initialize callback
     */
    initialize(callback) {
      sails.after([
        'hook:config:loaded',
        'hook:orm:loaded'
      ], () => {
        return MachineService.initialize()
          .then(() => {
            const driverName = MachineService.driverName();

            sails.log.info(`Driver ${driverName} is initialized`);
            callback();
          })
          .catch((err) => {
            callback(err);
          });
      });
    }
  };
}

module.exports = Driver;
