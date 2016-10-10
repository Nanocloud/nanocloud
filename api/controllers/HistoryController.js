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
 * HistoryController
 *
 * @description :: Server-side logic for managing histories
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global App, MachineService, Image, JsonApiService */

const _= require('lodash');

module.exports = {
  create(req, res) {
    req.body = JsonApiService.deserialize(req.body);

    let userId = _.get(req.body, 'data.attributes.userId');
    let connectionId = _.get(req.body, 'data.attributes.connectionId');

    if (!connectionId) {
      return res.badRequest('Invalid connection id');
    }

    App.findOne(connectionId)
      .then((app) => {
        if (!app) {
          throw new Error('Connection not found');
        }

        return Image.findOne(app.image);
      })
      .then((image) => {
        return MachineService.getMachineForUser({
          id: userId
        }, {
          id: image.id
        });
      })
      .then((machine) => {
        _.set(req.body, 'data.attributes.machineId', machine.id);
        _.set(req.body, 'data.attributes.machineType', machine.driver);
        _.set(req.body, 'data.attributes.machineDriver', machine.type);
        if (req.body.data.attributes.endDate === '') {
          return MachineService.sessionOpen({
            id: machine.user
          }, {
            id: machine.image
          });
        }
      })
      .then(() => {
        return JsonApiService.createRecord(req, res);
      })
      .catch((err) => {
        if (err.message === 'Connection not found') {
          return res.notFound(err);
        } else {
          return res.negotiate(err);
        }
      });
  },

  update(req, res) {

    req.body = JsonApiService.deserialize(req.body);

    let userId = _.get(req.body, 'data.attributes.userId');
    let connectionId = _.get(req.body, 'data.attributes.connectionId');
    if (!connectionId) {
      return res.badRequest('Invalid connectionId id');
    } else if (req.body.data.attributes.endDate === '') {
      return res.badRequest('Invalid end date');
    }

    App.findOne(connectionId)
      .then((app) => {
        if (!app) {
          throw new Error('Connection not found');
        }

        return Image.findOne(app.image);
      })
      .then((image) => {
        return MachineService.sessionEnded({
          id: userId
        }, {
          id: image.id
        })
          .then(() => {
            return MachineService.getMachineForUser({
              id: userId
            }, {
              id: image.id
            });
          });
      })
      .then((machine) => {
        _.set(req.body, 'data.attributes.machineId', machine.id);
        return JsonApiService.updateOneRecord(req, res);
      })
      .catch((err) => {
        if (err.message === 'Connection not found') {
          return res.notFound(err);
        } else {
          return res.negotiate(err);
        }
      });
  }
};
