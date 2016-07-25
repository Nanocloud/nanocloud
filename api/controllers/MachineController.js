/**
 * Nanocloud, a comprehensive platform to turn any application into a cloud
 * solution.
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
 * MachineController
 *
 * @description :: Server-side logic for managing machines
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals MachineService */

module.exports = {

  find: function(req, res) {

    MachineService.find((err, machines) => {

      if (err) {
        return res.negotiate(err);
      }

      return res.ok(machines);
    });
  },

  create: function(req, res) {
    res.ok(MachineService.create(req.body));
  },

  users: function(req, res) {

    MachineService.find((err, machines) => {

      if (err) {
        return res.negotiate(err);
      }

      res.ok(machines);
    });
  }
};
