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

const Promise = require('bluebird');

/* globals App, MachineService */

/**
 * Controller of apps resource.
 *
 * @class AppsController
 */
module.exports = {

  /*
   * Retrieves apps a given user can access
   *
   * @param {Object} a user object (usually req.user)
   * @return {Promise[array]} a promise resolving to an array of Apps
   */
  _getApps(user) {

    return new Promise((resolve, reject) => {
      return App.query({
        text: `SELECT DISTINCT
                 "app".id,
                 "app".alias,
                 "app"."displayName",
                 "app"."filePath"
                 FROM "app"
                 LEFT JOIN "appgroup" on appgroup.app = app.id
                 LEFT JOIN "group" on appgroup.group = "group".id
                 LEFT JOIN "usergroup" on usergroup.group = "group".id
                 WHERE usergroup.user = $1::varchar OR $2::boolean = true`,
        values: [
          user.id,
          user.isAdmin
        ]
      }, (err, apps) => {

        if (err) {
          return reject(err);
        }

        return resolve(apps);
      });
    });
  },

  find(req, res) {

    this._getApps(req.user)
      .then((apps) => {
        return res.ok(apps.rows);
      })
      .catch((err) => {
        return res.negotiate(err);
      });
  },

  /**
   * Handles the /apps/connections endpoint
   *
   * @method connections
   */
  connections(req, res) {
    MachineService.getMachineForUser(req.user)
      .then((machine) => {
        return this._getApps(req.user)
          .then((apps) => {

            var connections = [];
            apps.rows.forEach((app) => {

              connections.push({
                id: app.id,
                hostname: machine.ip,
                machineId: machine.id,
                machineType: machine.flavor,
                machineDriver: machine.type,
                port: 3389,
                username: machine.username,
                password: machine.password,
                'remote-app': '',
                protocol: 'rdp',
                'app-name': app.alias
              });
            });

            return res.ok(connections);
          });
      })
      .catch((err) => {
        if (err !== 'Exceeded credit') {
          return res.negotiate(err);
        } else {
          res.status(402);
          return res.send(err);
        }
      });
  }
};
