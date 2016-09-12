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
 *
 * AWSDriver
 *
 * @description :: Driver for Amazon Web Service EC2 Iaas
 */

/* global ConfigService*/

const request = require('request-promise');
const Promise = require('bluebird');

const Driver = require('../driver');


/**
 * Driver for libvirt API
 *
 * @class LibvirtDriver
 */
class LibvirtDriver extends Driver {

  /**
   * Initializes the Libvirt driver.
   * Requires the `ConfigService` variables:
   *  - libvirtConnectionURI: The connection string for libvirt
   *
   * @method initialize
   * @return {Promise}
   */
  initialize() {
    return ConfigService.get('libvirtServiceURL', 'libvirtServicePort')
      .then((config) => {

        console.log('http://' + config.libvirtServiceURL + ':' + config.libvirtServicePort);
        let requestOptions = {
          url: 'http://' + config.libvirtServiceURL + ':' + config.libvirtServicePort,
          method: 'GET'
        };

        return request(requestOptions);
      });
  }

  /**
   * Return the name of the driver.
   *
   * @method name
   * @return {String} The name of the driver
   */
  name() {
    return 'libvirt';
  }

  /**
   * Create a new virtual machine. It uses the `ConfigService` variables:
   *  - libvirtMemory: Memory in MB
   *  - libvirtCPU: Number of vCPU
   *  - libvirtDrive: Hard drive file (qcow2)
   *  - plazaPort: Port to contact plaza
   *
   * @method createMachine
   * @param {Object} options The machine options. `options.name`: The name of
   * the machine
   * @return {Promise[Machine]} The created machine
   */
  createMachine(options) {
    return ConfigService.get('libvirtServiceURL', 'libvirtServicePort',
      'libvirtMemory', 'libvirtCPU', 'libvirtDrive', 'plazaPort')
      .then((config) => {
        let requestOptions = {
          url: 'http://' + config.libvirtServiceURL + ':' + config.libvirtServicePort + '/machines',
          json: true,
          body: {
            name: options.name,
            cpu: config.libvirtCPU,
            memory: config.libvirtMemory,
            drive: config.libvirtDrive
          },
          method: 'POST'
        };

        return request(requestOptions);
      });
  }

  /**
   * Destroy the specified machine.
   *
   * @method destroyMachine
   * @return {Promise}
   */
  destroyMachine(machine) {
    return ConfigService.get('libvirtServiceURL', 'libvirtServicePort')
      .then((config) => {
        let requestOptions = {
          url: 'http://' + config.libvirtServiceURL + ':' + config.libvirtServicePort + '/machines/' + machine.id,
          json: true,
          method: 'DELETE'
        };

        return request(requestOptions);
      });
  }

  /**
   * Retrieve the server with the specified id.
   *
   * @method getServer
   * @return {Promise[Object]}
   */
  getServer(id) {
    // Not implemented yet
    console.log(id);
  }

  /*
   * Create an image from a machine
   * The image will be used as default image for future execution servers
   *
   * @method createImage
   * @param {Object} Image object with `buildFrom` attribute set to the machine id to create image from
   * @return {Promise[Image]} resolves to the new default image
   */
  createImage(imageToCreate) {
    console.log(imageToCreate);
  }
}

module.exports = LibvirtDriver;
