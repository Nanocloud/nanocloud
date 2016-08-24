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

/* global MachineService, JsonApiService, History */

module.exports = {
  create(req, res) {
    req.body = JsonApiService.deserialize(req.body);

    if (req.body.data.attributes.endDate === '') {
      MachineService.sessionOpen(req.user);
    }
    return JsonApiService.createRecord(req, res);
  },

  update(req, res) {
    req.body = JsonApiService.deserialize(req.body);

    if (req.body.data.attributes.endDate !== '') {
      MachineService.sessionEnded(req.user);
    }

    return this.updateOneRecord(req, res);
  },

  updateOneRecord(req, res) {
    var data = req.body.data.attributes || {};
    var id = req.options.id || (req.options.where && req.options.where.id) || req.allParams().id;

    if (req.allParams().id) {
      data.id = req.allParams().id;
    }
    History.update(id, data)
      .then((records) => {
        if (!records || !records.length || records.length > 1) {
          res.negotiate('Unexpected output from `' + History.globalId + '.update`.');
        }

        var updatedRecord = records[0];

        if (updatedRecord === undefined) {
          return res.notFound();
        }

        return res.ok(updatedRecord);
      })
      .then(() => {
        if (data.endDate !== '') {
          MachineService.sessionEnded(req.user);
        } else {
          res.negotiate('No endDate set');
        }
      })
      .catch((err) => {
        res.negotiate(err);
      });
  }
};
