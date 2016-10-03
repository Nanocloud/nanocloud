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

/* global Machine, ConfigService, Image, MachineService */

const request = require('request-promise');
const Driver = require('../driver');
const Promise = require('bluebird');

/**
 * Driver for Qemu API
 *
 * @class QemuDriver
 */
class QemuDriver extends Driver {

  /**
   * Initializes the Qemu driver.
   *
   * @method initialize
   * @return {Promise}
   */
  initialize() {
    return ConfigService.get('qemuServiceURL', 'qemuServicePort')
      .then((config) => {
        Image.update({
          default: true
        }, {
          iaasId: 'image.qcow2',
          name: 'Qemu default image',
          password: null
        })
          .then(() => {

            let requestOptions = {
              url: 'http://' + config.qemuServiceURL + ':' + config.qemuServicePort,
              method: 'GET'
            };

            return request(requestOptions);
          });
      });
  }

  /**
   * Return the name of the driver.
   *
   * @method name
   * @return {String} The name of the driver
   */
  name() {
    return 'qemu';
  }

  /**
   * Create a new virtual machine. It uses the `ConfigService` variables:
   *  - qemuMemory: Memory in MB
   *  - qemuCPU: Number of vCPU
   *  - qemuDrive: Hard drive file (qcow2)
   *  - qemuMachineUsername: Windows account username
   *  - qemuMachinePassword: Windows account password
   *
   * @method createMachine
   * @param {Object} options The machine options. `options.name`: The name of
   * the machine
   * @return {Promise[Machine]} The created machine
   */
  createMachine(options) {
    return Promise.props({
      config: ConfigService.get('qemuServiceURL', 'qemuServicePort',
        'qemuMemory', 'qemuCPU', 'plazaPort',
        'qemuMachineUsername', 'qemuMachinePassword'),
      image: MachineService.getDefaultImage()
    })
      .then((obj) => {
        var config = obj.config;
        var image = obj.image;
        let requestOptions = {
          url: 'http://' + config.qemuServiceURL + ':' + config.qemuServicePort + '/machines',
          json: true,
          body: {
            name: options.name,
            cpu: config.qemuCPU,
            memory: config.qemuMemory,
            drive: image.iaasId,
          },
          method: 'POST'
        };

        return request(requestOptions)
          .then((res) => {
            return new Machine._model({
              id        : res.id,
              name      : res.name,
              type      : this.name(),
              ip        : config.qemuServiceURL,
              username  : config.qemuMachineUsername,
              password  : config.qemuMachinePassword,
              domain    : '',
              plazaport : res.plazaPort,
              rdpPort   : res.rdpPort,
              status    : res.status
            });
          });
      });
  }

  stopMachine(machine) {
    return ConfigService.get('qemuServiceURL', 'qemuServicePort')
      .then((config) => {
        let requestOptions = {
          url: 'http://' + config.qemuServiceURL + ':' + config.qemuServicePort + '/machines/stop/' + machine.id,
          json: true,
          method: 'POST'
        };

        return request(requestOptions)
          .then((res) => {
            machine.status = res.status;
            return(machine);
          });
      });
  }

  startMachine(machine) {
    return ConfigService.get('qemuServiceURL', 'qemuServicePort')
      .then((config) => {
        let requestOptions = {
          url: 'http://' + config.qemuServiceURL + ':' + config.qemuServicePort + '/machines/start/' + machine.id,
          json: true,
          method: 'POST'
        };

        return request(requestOptions)
          .then((res) => {
            machine.status = res.status;
            return(machine);
          });
      });
  }

  /**
   * Destroy the specified machine.
   *
   * @method destroyMachine
   * @return {Promise}
   */
  destroyMachine(machine) {
    return ConfigService.get('qemuServiceURL', 'qemuServicePort')
      .then((config) => {
        let requestOptions = {
          url: 'http://' + config.qemuServiceURL + ':' + config.qemuServicePort + '/machines/' + machine.id,
          json: true,
          method: 'DELETE'
        };

        return request(requestOptions)
          .then((res) => {
            return(res);
          });
      });
  }

  /**
   * Retrieve the machine's password
   *
   * @method getPassword
   * @param {machine} Machine model
   * @return {Promise[String]}
   */
  getPassword() {
    return ConfigService.get('qemuMachinePassword')
      .then((config) => {
        return (config.qemuMachinePassword);
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
    return id;
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
    return new Promise((resolve, reject) => {
      return Promise.props({
        config: ConfigService.get('qemuServiceURL', 'qemuServicePort'),
        image: MachineService.getDefaultImage()
      })
        .then((res) => {
          return request({
            url: 'http://' + res.config.qemuServiceURL + ':' + res.config.qemuServicePort + '/images',
            json: true,
            method: 'POST',
            body: {
              buildFrom: imageToCreate.buildFrom,
              iaasId: imageToCreate.name
            }
          });
        })
        .then((res) => {
          return Image.update({
            default: true
          }, {
            iaasId: res.iaasId,
            name: 'Qemu default image',
            password: null,
            buildFrom: imageToCreate.buildFrom
          });
        })
        .then((image) => {
          return resolve(image);
        })
        .catch((err) => {
          return reject(err);
        });
    });
  }

  /**
   * Retrieve the machine's data
   *
   * @method refresh
   * @param {machine} Machine model
   * @return {Promise[Machine]}
   */
  refresh(machine) {
    return ConfigService.get('qemuServiceURL', 'qemuServicePort')
      .then((config) => {
        let promise = null;

        if (machine.status === 'booting') {
          let requestOptions = {
            url: 'http://' + machine.ip + ':' + machine.plazaport,
            method: 'GET'
          };
          promise = request(requestOptions);
        } else {
          promise = Promise.resolve();
        }

        return promise.then(() => {
          let requestOptions = {
            url: 'http://' + config.qemuServiceURL + ':' + config.qemuServicePort + '/machines/status/' + machine.id,
            json: true,
            method: 'GET'
          };
          return request(requestOptions)
            .then((res) => {
              machine.status = (res.status === 'paused') ? 'stopped' : res.status;
              return machine;
            });
        });
      });
  }

  /**
   * Reboot the machine
   *
   * @method rebootMachine
   * @param string Id of the machine
   * @return {Promise[{object}]}
   */
  rebootMachine(machine) {
    return ConfigService.get('qemuServiceURL', 'qemuServicePort')
        .then((configs) => {
          let requestOptions = {
            url: 'http://' + configs.qemuServiceURL + ':' + configs.qemuServicePort + '/machines/' + machine.id,
            json: true,
            body: {
              ip: machine.ip,
              plazaPort: machine.plazaport,
            },
            method: 'PATCH'
          };

          return request(requestOptions)
            .then((state) => {
              machine.status = state.status;
              return machine;
            });
        });
  }
}

module.exports = QemuDriver;
