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

/* global Machine, MachineService, JsonApiService */

const _= require('lodash');

module.exports = {
  create(req, res) {
    req.body = JsonApiService.deserialize(req.body);

    let machineId = _.get(req.body, 'data.attributes.machineId');

    if (!machineId) {
      return res.badRequest('Invalid machine id');
    }

    Machine.findOne(machineId)
      .then((machine) => {
        if (req.body.data.attributes.endDate === '') {
          MachineService.sessionOpen({
            id: machine.user
          });
        }

        return JsonApiService.createRecord(req, res);
      });
  },

  update(req, res) {

    req.body = JsonApiService.deserialize(req.body);

    let machineId = _.get(req.body, 'data.attributes.machineId');

    if (!machineId) {
      return res.badRequest('Invalid machine id');
    }

    Machine.findOne(machineId)
      .then((machine) => {
        if (req.body.data.attributes.endDate !== '') {
          MachineService.sessionEnded({
            id: machine.user
          });
        }

        return JsonApiService.updateOneRecord(req, res);
      });
  }
};
