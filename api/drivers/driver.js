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
   * Create a machine from an image
   *
   * @method createMachine
   * @param {Object[Machine]} properties worth to be passed along to the driver
   * @param {Object[Image]} An image object the machine needs to be built from
   * @return {Promise[Machine]} A promise resolving to the created machine
   */
  createMachine(/*machine, image*/) {
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

  /*
   * Create an image from a machine
   * The image will be used as default image for future execution servers
   *
   * @method createImage
   * @param {Object} Image object with `buildFrom` attribute set to the machine id to create image from
   * @return {Promise[Image]} resolves to the new default image
   */
  createImage(/* image */) {
    return Promise.reject(new Error('Driver\'s method "createImage" not implemented'));
  }

  /**
   * Calculate credit used by a user
   *
   * @method getUserCredit
   * @param {Object} User model
   * @return {Promise[number]}
   */
  getUserCredit(/* user */) {
    return Promise.reject(new Error('Driver\'s method \'getUserCredit\' not implemented'));
  }

  /**
   * Refresh machine's data
   *
   * @method refresh
   * @param {Object} Machine model
   * @return {Promise[Machine]}
   */
  refresh(/* machine */) {
    return Promise.reject(new Error('Driver\'s method \'refresh\' not implemented'));
  }

  /**
   * Retrieve machine's password
   *
   * @method getPassword
   * @param {Object} Machine model
   * @return {Promise[String]}
   */
  getPassword(/* machine */) {
    return Promise.reject(new Error('Driver\'s method \'getPassword\' not implemented'));
  }

  /**
   * Reboot the machine
   *
   * @method rebootMachine
   * @param string Id of the machine
   * @return {Promise[{object}]}
   */
  rebootMachine(/* machine id */) {
    return Promise.reject(new Error('Driver\'s method \'rebootMachine\' not implemented'));
  }
}

module.exports = Driver;
