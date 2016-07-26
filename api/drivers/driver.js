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

/* jshint unused:vars */
/* globals Machine */

module.exports = {

  /*
   * Method to be executed when driver is loaded
   *
   * @method init
   * @param {function} callback to call when init is done
   */
  init: function(done) {
    sails.log.verbose("Driver's init method not implemented");
  },

  /*
   * Return list of machines
   * Default behavior is to return all stored machines
   *
   * @method find
   * @param {function} callback to call one find is done
   * @return {array} Array of model Machine
   */
  find: function(done) {
    Machine.find()
      .then((machines) => {
        return done(null, machines);
      })
      .catch((err) => {
        return done(err);
      });
  },

  /*
   * Return list of machines
   *
   * @method create
   * @param {object} Machine model to be created
   * @param {function} callback to call one find is done
   * @return {object} Machine model created
   */
  create: function(data, done) {
    throw new Error("Driver's method 'create' not implemented");
  }
};
