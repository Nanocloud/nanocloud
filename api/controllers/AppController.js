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
 */

/* globals App, MachineService */

/**
 * Controller of apps resource.
 *
 * @class AppsController
 */
module.exports = {

  find(req, res) {

    return App.find()
      .populate("groups")
      .then((res.ok));
  },

  /**
   * Handles the /apps/connections endpoint
   *
   * @method connections
   */
  connections(req, res) {
    MachineService.getMachineForUser(req.user)
      .then((machine) => {
        var connections = [];

        return App.find()
          .then((apps) => {
            apps.forEach((app) => {
              connections.push({
                id: app.id,
                hostname: machine.ip,
                port: 3389,
                username: machine.username,
                password: machine.password,
                "remote-app": '',
                protocol: 'rdp',
                "app-name": app.alias
              });
            });

            return res.ok(connections);
          })
          .catch((err) => {
            return res.negotiate(err);
          });
      })
      .catch((err) => res.negotiate(err));
  }
};
