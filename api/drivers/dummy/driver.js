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

/* globals Machine */

const Promise = require('bluebird');
const uuid = require('node-uuid');

const BaseDriver = require('../driver');

class DummyDriver extends BaseDriver {

  /**
   * Method executed when the driver is loaded
   *
   * @method initialize
   * @return {Promise}
   */
  initialize() {
    this._machines = {};
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

    this._machines[machine.id] = machine;
    return Machine.create(machine);
  }

  destroyMachine(machine) {
    if (this._machines.hasOwnProperty(machine.id)) {
      delete this._machines[machine.id];
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('machine not found'));
    }
  }
}

module.exports = DummyDriver;
