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

/* globals Machine, Image */

const Promise = require('bluebird');
const uuid = require('node-uuid');
const http = require('http');

const BaseDriver = require('../driver');

let _plazaPort;
let _plazaAddress;

let _sessionOpen = false; // Used by fake plaza to hold session status

class DummyDriver extends BaseDriver {

  /**
   * Method executed when the driver is loaded
   *
   * @method initialize
   * @return {Promise}
   */
  initialize() {
    this._machines = {};

    var FakePlaza = http.createServer((req, res) => {
      res.writeHead(200, {'Content-Type': 'application/json'});

      if (req.url === '/sessions/') {

        let status = (_sessionOpen === true) ? 'Active' : 'Inactive';
        let data = {
          data: [
            [
              null, // Unknown parameter
              'username', // Unused for now
              null, // unknown paramater
              status
            ]
          ]
        };

        return res.end(JSON.stringify(data));
      } else if (req.url === '/sessionOpen') {
        _sessionOpen = true;
      } else if (req.url === '/sessionClose') {
        _sessionOpen = false;
      }

      return res.end();
    }).listen(0);

    if (!FakePlaza) {
      throw new Error('Fake plazaport failed to create');
    } else {
      _plazaPort = FakePlaza.address().port;
      _plazaAddress = '127.0.0.1';

      return Promise.resolve();
    }
  }

  /**
   * Returns the name of the driver used
   *
   * @method name
   * @return {String} The name of the driver
   */
  name() {
    return 'dummy driver';
  }

  /*
   * Return the created machine
   *
   * @method createMachine
   * @param {Object} options model to be created
   * @return {Promise[Machine]} Machine model created
   */
  createMachine(options) {
    let machine = {};
    const id = uuid.v4();

    machine.id = id;
    machine.name = options.name;
    machine.ip = _plazaAddress;
    machine.plazaport = _plazaPort;

    this._machines[machine.id] = machine;
    return new Promise((resolve, reject) => {
      Machine.create(machine)
      .then(resolve, reject);
    });
  }

  destroyMachine(machine) {
    if (this._machines.hasOwnProperty(machine.id)) {
      delete this._machines[machine.id];
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('machine not found'));
    }
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

    return Machine.findOne(imageToCreate.buildFrom)
      .then((machine) => {

        return Image.update({
          default: true
        }, {
          iaasId: uuid.v4(),
          name: imageToCreate.name,
          buildFrom: imageToCreate.buildFrom,
          password: machine.password
        })
          .then((images) => {

            return images.pop();
          });
      });
  }
}

module.exports = DummyDriver;
