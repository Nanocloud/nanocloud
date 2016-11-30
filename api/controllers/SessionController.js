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
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

const Promise = require('bluebird');
const _ = require('lodash');

/* globals Machine */

module.exports = {

  find: function(req, res) {
    let promise = null;

    if (req.user.isAdmin) {
      promise = Machine.find();
    } else {
      promise = Machine.find().populate('users', { id: req.user.id });
    }

    promise
      .then((machines) => {
        if (!req.user.isAdmin) {
          _.remove(machines, (machine) => machine.users.length !== 0);
        }

        let sessionsRequest = [];
        machines.forEach((machine) => {
          sessionsRequest.push(machine.getSessions());
        });

        Promise.all(sessionsRequest)
          .timeout(10000)
          .then((sessions) => {

            sessions = _.reject(sessions, _.isEmpty);
            sessions = _.flatten(sessions);

            return res.ok(sessions);
          })
          .catch(res.negotiate);
      });
  },

  disconnect: function(req, res) {

    let machineId = _.get(req.body, 'machineId');
    if (!machineId) {
      return res.badRequest('Invalid machine id');
    }

    Machine.findOne(machineId)
      .then((machine) => {
        return machine.killSession(req.user);
      })
      .then(() => {
        return res.json({
          meta: {}
        });
      })
      .catch((err) => res.negotiate(err));
  }
};
