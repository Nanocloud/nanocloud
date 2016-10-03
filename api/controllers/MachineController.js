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

/* globals MachineService, Machine */

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
    if (req.user.isAdmin) {
      Machine.find()
        .populate('user')
        .then((machines) => {
          return res.ok(machines);
        })
        .catch((err) => res.negotiate(err));
    } else {
      Machine.find({
        user: req.user.id
      })
        .populate('user')
        .then((machines) => {
          return res.ok(machines);
        })
        .catch((err) => res.negotiate(err));
    }
  },

  /**
   * @method findOne
   */
  findOne(req, res) {
    Machine.findOne({
      id: req.params.id
    })
      .then((machine) => {
        if (req.user.isAdmin || machine.user === req.user.id) {
          return res.ok(machine);
        } else {
          return res.forbidden();
        }
      })
      .catch((err) => res.negotiate(err));
  },

  update(req, res) {

    var status = req.body.data.attributes.status;
    if (status === 'rebooting' || status === 'stopping' || status === 'starting') {
      return Machine.findOne({
        id: (status === 'rebooting') ? req.body.data.id : req.params.id
      })
        .then((machine) => {
          if (status === 'rebooting') {
            machine.reboot();
            return machine;
          } else if (status === 'starting') {
            return MachineService.startMachine(machine);
          } else if (status === 'stopping') {
            return MachineService.stopMachine(machine);
          }
        })
        .then((machine) => {
          return res.ok(machine);
        })
        .catch((err) => {
          res.status = 400;
          return res.send(err);
        });
    } else {
      return res.forbidden();
    }
  },

  /**
   * @method users
   */
  users(req, res) {
    MachineService.getMachineForUser(req.user)
      .then((machines) => {
        return res.ok([machines]);
      })
      .catch((err) =>  {
        if (err === 'Exceeded credit') {
          return res.send(402, err);
        } else if (err === 'A machine is booting for you. Please retry in one minute.') {
          res.notFound(err);
        } else {
          return res.negotiate(err);
        }
      });
  },

  /**
   * @methods start
   */
  start(req, res) {
    Machine.findOne({
      id: req.params.id
    })
      .then((machine) => {
        return MachineService.startMachine(machine);
      })
      .then((machine) => {
        return res.ok(machine);
      })
      .catch((err) => {
        return res.send(400, err);
      });
  },

  /**
   * @method stop
   */
  stop(req, res) {
    Machine.findOne({
      id: req.params.id
    })
      .then((machine) => {
        return MachineService.stopMachine(machine);
      })
      .then((machine) => {
        return res.ok(machine);
      })
      .catch((err) => {
        return res.send(400, err);
      });
  }
};
