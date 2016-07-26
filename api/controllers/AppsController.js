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
 * AppsController
 *
 * @description :: Server-side logic for managing apps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals Apps, MachineService */

module.exports = {

  connections: function(req, res) {

    MachineService.find((err, machines) => {

      if (err) {
        return res.negotiate(err);
      }

      const userMachine = machines[0];
      var connections = [];

      return Apps.find()
        .then((apps) => {
          apps.forEach((app) => {
            connections.push({
              id: app.id,
              hostname: userMachine.ip,
              port: 3389,
              username: 'Administrator',
              password: userMachine.adminPassword,
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
    });
  }
};
