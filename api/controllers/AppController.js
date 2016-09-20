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
const _ = require('lodash');

/* globals App, ConfigService, MachineService, JsonApiService, PlazaService, StorageService, Team */

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
                 "app"."filePath",
                 "app"."image"
                 FROM "app"
                 LEFT JOIN "imagegroup" on imagegroup.image = app.image
                 LEFT JOIN "group" on imagegroup.group = "group".id
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

  findOne(req, res) {
    if (req.user.isAdmin) {
      App.findOne({
        id: req.allParams().id
      })
        .populate('image')
        .then((app) => {
          return res.ok(app);
        });
    } else {
      this._getApps(req.user)
        .then((apps) => {
          apps = apps.rows;
          var app = _.find(apps, function(element) { return element.id === req.allParams().id; });
          if (app) {
            return res.ok(app);
          }
          return res.notFound();
        });
    }
  },

  find(req, res) {

    this._getApps(req.user)
      .then((apps) => {
        let appIds = _.map(apps.rows, 'id');

        App.find(appIds)
          .populate('image')
          .then((apps) => {
            return res.ok(apps);
          });
      })
      .catch((err) => {
        return res.negotiate(err);
      });
  },

  create(req, res) {

    var values = JsonApiService.deserialize(req.body.data.attributes);

    MachineService.getDefaultImage()
      .then((defaultImage) => {

        values.image = defaultImage.id;
        App.create(values)
          .then(res.created)
          .catch(res.negotiate);
      });
  },

  update(req, res) {

    let applicationData = JsonApiService.deserialize(req.body.data);
    let attributes = applicationData.attributes;

    App.update({
      id: req.allParams().id
    }, (req.user.isAdmin) ? attributes : {state: attributes.state})
      .then((applications) => {

        let application = applications.pop();

        if (application.state === 'running') {
          MachineService.getMachineForUser(req.user)
            .then((machine) => {
              return PlazaService.exec(machine.ip, machine.plazaport, {
                command: [
                  application.filePath
                ],
                username: machine.username
              })
                .then(() => {
                  return StorageService.findOrCreate(req.user);
                })
                .then((storage) => {
                  return PlazaService.exec(machine.ip, machine.plazaport, {
                    command: [
                      `C:\\Windows\\System32\\net.exe`,
                      'use',
                      'z:',
                      `\\\\${storage.hostname}\\${storage.username}`,
                      `/user:${storage.username}`,
                      storage.password
                    ],
                    wait: true,
                    hideWindow: true,
                    username: machine.username
                  })
                    .catch(() => {
                      // User storage is probably already mounted
                      // Let's ignore the error silently
                      return Promise.resolve();
                    });
                })
                .then(() => {
                  return PlazaService.exec(machine.ip, machine.plazaport, {
                    command: [
                      `C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
                      '-Command',
                      '-'
                    ],
                    wait: true,
                    hideWindow: true,
                    username: machine.username,
                    stdin: '$a = New-Object -ComObject shell.application;$a.NameSpace( "Z:\" ).self.name = "Personal Storage"'
                  });
                })
                .then(() => {
                  if (req.user.team) {
                    Team.findOne(req.user.team)
                      .then((team) => {
                        return ConfigService.get('teamStorageAddress')
                          .then((config) => {
                            let command = [
                              `C:\\Windows\\System32\\net.exe`,
                              'use',
                              'y:',
                              `\\\\${config.teamStorageAddress}\\${team.username}`,
                              `/user:${team.username}`,
                              team.password
                            ];
                            return PlazaService.exec(machine.ip, machine.plazaport, {
                              command: command,
                              wait: true,
                              hideWindow: true,
                              username: machine.username
                            });
                          });
                      })
                      .then(() => {
                        return PlazaService.exec(machine.ip, machine.plazaport, {
                          command: [
                            `C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
                            '-Command',
                            '-'
                          ],
                          wait: true,
                          hideWindow: true,
                          username: machine.username,
                          stdin: '$a = New-Object -ComObject shell.application;$a.NameSpace( "Y:\" ).self.name = "Team"'
                        });
                      });
                  }
                });
            });
        }
        return res.ok(application);
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
        if (err === 'Exceeded credit') {
          return res.send(402, err);
        } else {
          return res.negotiate(err);
        }
      });
  }
};
