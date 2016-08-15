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

const Promise = require('bluebird');

/**
 * The base driver from which other driver should inherite.
 *
 * @class Driver
 */
class Driver {

  /**
   * Method executed when the driver is loaded
   *
   * @method initialize
   * @return {Promise}
   */
  initialize() {
    return Promise.reject(new Error('Driver\'s init method not implemented'));
  }


  /**
   * Returns the name of the driver used
   *
   * @method name
   * @return {String} The name of the driver
   */
  name() {
    return 'base driver';
  }

  /*
   * Return list of machines
   *
   * @method createMachine
   * @param {Object} options model to be created
   * @return {Promise[Machine]} Machine model created
   */
  createMachine(/* options */) {
    return Promise.reject(new Error('Driver\'s method "createMachine" not implemented'));
  }

  destroyMachine(/* machine */) {
    return Promise.reject(new Error('Driver\'s method "destroyMachine" not implemented'));
  }

 /**
   * Return the server with the specified id.
   *
   * @method getServer
   * @return {Promise[Object]}
   */
  getServer(/* id */) {
    return Promise.reject(new Error('Driver\'s method "getServer" not implemented'));
  }
}

module.exports = Driver;
