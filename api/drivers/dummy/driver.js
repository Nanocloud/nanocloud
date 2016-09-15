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
    this.dummyPrice = new Promise((resolve) => {
      return resolve({
        products : {
          SUPPEZST6XFGKCM2 : {
            sku : 'SUPPEZST6XFGKCM2',
            productFamily : 'Compute Instance',
            attributes : {
              servicecode : 'AmazonEC2',
              location : 'EU (Frankfurt)',
              locationType : 'AWS Region',
              instanceType : 't2.small',
              instanceFamily : 'General purpose',
              vcpu : '1',
              physicalProcessor : 'Intel Xeon Family',
              clockSpeed : 'Up to 3.3 GHz',
              memory : '2 GiB',
              storage : 'EBS only',
              networkPerformance : 'Low to Moderate',
              processorArchitecture : '32-bit or 64-bit',
              tenancy : 'Shared',
              operatingSystem : 'Windows',
              licenseModel : 'License Included',
              usagetype : 'EUC1-BoxUsage:t2.small',
              operation : 'RunInstances:0002',
              preInstalledSw : 'NA',
              processorFeatures : 'Intel AVX; Intel Turbo',
              price : '0.04'
            }
          }
        }
      });
    });

    var FakePlaza = http.createServer((req, res) => {
      res.writeHead(200, {'Content-Type': 'application/json'});

      if (req.url === '/sessions/Administrator' && req.method === 'GET') {

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
      } else if (req.url === '/sessions/Administrator' && req.method === 'DELETE') {
        _sessionOpen = false;
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
    return 'dummy';
  }

  /*
   * Return the created machine
   *
   * @method createMachine
   * @param {Object} options model to be created
   * @return {Promise[Machine]} Machine model created
   */
  createMachine(options) {
    const id = uuid.v4();
    let machine = new Machine._model({
      id        : id,
      name      : options.name,
      type      : 'dummy',
      flavor    : 'dummy',
      ip        : _plazaAddress,
      username  : 'Administrator',
      plazaport : _plazaPort,
      domain    : ''
    });

    this._machines[machine.id] = machine;
    return new Promise.resolve(machine);
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

  /**
   * Calculate credit used by a user
   *
   * @method getUserCredit
   * @param {user} user User to calculate credit usage from
   * @return {Promise[number]}
   */
  getUserCredit(user) {

    return this.dummyPrice.then((price) => {
      return new Promise((resolve, reject) => {
        var finalPrice = 0;
        let history = [];
        user.getHistory('aws')
          .then((machineHistory) => {

            /**
             * Here we retrieve all the machines keys of the
             * history we retrived before, matching with machines type
             */
            history = machineHistory;

            var prod = Object.keys(price.products);

            history.forEach((element) => {
              prod.forEach((key) => {
                if (price.products[key].attributes.instanceType === element.type) {
                  element.time = element.time * price.products[key].attributes.price;
                }
              });
            });
          })
          .then(() => {
            history.forEach((element) => {
              finalPrice += element.time;
            });
          })
          .then(() => {
            return resolve(parseFloat(finalPrice.toFixed(4)));
          })
          .catch((err) => {
            return reject(err);
          });
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
    return new Promise((resolve, reject) => {
      if (machine.status === 'error') {
        reject(machine.status);
      }
      machine.status = 'running';
      return resolve(machine);
    });
  }

  /**
   * Retrieve the machine's password
   *
   * @method getPassword
   * @param {machine} Machine model
   * @return {Promise[String]}
   */
  getPassword(machine) {
    return new Promise((resolve, reject) => {
      if (machine.status === 'error') {
        reject(machine.status);
      }
      return resolve(machine.password);
    });
  }
}

module.exports = DummyDriver;
