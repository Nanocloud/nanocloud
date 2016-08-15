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

/* globals MachineService */

/**
 * Server-side logic for managing machines
 *
 * @class MachineController
 */
module.exports = {

  /**
   * @method find
   */
  find(req, res) {
    MachineService.machines()
      .then((machines) => {
        return res.ok(machines);
      })
      .catch((err) => res.negotiate(err));
  },

  /**
   * @method create
   */
  create(req, res) {
    return res.ok(MachineService.create(req.body));
  },

  /**
   * @method users
   */
  users(req, res) {
    MachineService.getMachineForUser(req.user)
      .then((machines) => {
        return res.ok(machines);
      })
      .catch((err) =>  {
        return res.send(402, err);
      });
  }
};
