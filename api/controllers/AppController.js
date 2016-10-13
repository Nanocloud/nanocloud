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

/* globals App, UserGroup, Image, ImageGroup, Machine, MachineService, JsonApiService, PlazaService */

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

  create(req, res) {
    req.body = JsonApiService.deserialize(req.body);

    let app = _.get(req, 'body.data.attributes');
    if (!app) {
      return res.badRequest('Invalid application attributes');
    }
    app.image = req.body.data.relationships.image.data.id;

    App.create(app)
      .populate('image')
      .then(res.created)
      .catch(res.negotiate);
  },

  findOne(req, res) {
    if (req.user.isAdmin) {
      App.findOne({
        id: req.allParams().id
      })
        .populate('image')
        .then(res.ok);
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

  update(req, res) {

    let applicationData = JsonApiService.deserialize(req.body.data);
    let attributes = applicationData.attributes;

    App.update({
      id: req.allParams().id
    }, (req.user.isAdmin) ? attributes : {state: attributes.state})
      .then((apps) => {
        let app = apps.pop();

        if (app.state === 'running') {
          return MachineService.getMachineForUser(req.user, {
            id: app.image
          })
            .then((machine) => {
              if (!machine) {
                throw new Error('A machine is booting for you');
              }

              return PlazaService.exec(machine.ip, machine.plazaport, {
                command: [
                  app.filePath
                ],
                username: machine.username
              })
                .then(() => {
                  return PlazaService.exec(machine.ip, machine.plazaport, {
                    command: [
                      `C:\\Windows\\photon\\photon.bat`
                    ],
                    username: machine.username
                  });
                })
                .then(() => {
                  return res.ok(app);
                });
            });
        } else {
          return res.ok(app);
        }
      })
      .catch((err) => {
        if (err.message === 'A machine is booting for you') {
          return res.notFound(err);
        } else {
          return res.negotiate(err);
        }
      });
  },

  /**
   * Handles the /apps/connections endpoint
   *
   * @method connections
   */
  connections(req, res) {

    var connections = [];
    var getImagesPromise = null;

    if (req.user.isAdmin) {
      getImagesPromise = Image
        .find()
        .populate('apps');
    } else {
      getImagesPromise = UserGroup.find({
        user: req.user.id
      })
        .then((userGroups) => {
          return Promise.map(userGroups, function(userGroup) {
            return ImageGroup.find({
              group: userGroup.group
            });
          });
        })
        .then((images) => {
          images = _.flatten(images);
          let imagesId = _.map(images, 'image');
          return Image
            .find(imagesId)
            .populate('apps');
        });
    }

    return getImagesPromise
      .then((images) => {
        return Promise.map(images, function(image) {
          return Machine.findOne({
            user: req.user.id,
            image: image.id
          })
            .then((machine) => {
              if (machine) {
                image.apps.forEach((app) => {
                  connections.push({
                    id: app.id,
                    hostname: machine.ip,
                    machineId: machine.id,
                    machineType: machine.flavor,
                    machineDriver: machine.type,
                    port: machine.rdpPort,
                    username: machine.username,
                    password: machine.password,
                    'remote-app': '',
                    protocol: 'rdp',
                    'app-name': app.id
                  });
                });
              }
            });
        });
      })
      .then(() => {
        return res.ok(connections);
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
