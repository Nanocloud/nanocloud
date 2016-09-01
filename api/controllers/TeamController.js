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
 * TeamController
 *
 * @description :: Server-side logic for managing configs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals JsonApiService, Team, User */

module.exports = {
  create(req, res) {
    const user = req.user;

    const body = JsonApiService.deserialize(req.body);

    if (user.team) {
      return res.badRequest('You already belong to a team');
    }

    let team = {
      name: body.data.attributes.name,
      members: [ user.id ]
    };

    return Team.create(team)
      .then((team) => {

        return User.update(user.id, {
          isTeamAdmin: true
        })
          .then(() => {
            return Team.findOne(team.id)
              .populate('members')
              .populate('pendingMembers')
              .then(res.created);
          });
      })
    .catch(res.negotiate);
  },

  find(req, res) {
    const user = req.user;

    if (user.isAdmin) {
      return Team.find()
        .populate('members')
        .populate('pendingMembers')
        .then((teams) => {
          res.send(JsonApiService.serialize('teams', teams));
        })
        .catch(res.negotiate);
    }

    if (!user.team) {
      return res.send(JsonApiService.serialize('teams', []));
    }

    if (user.isTeamAdmin) {
      return Team.findOne(user.team)
        .populate('members')
        .populate('pendingMembers')
        .then((teams) => {
          res.send(JsonApiService.serialize('teams', [teams]));
        })
        .catch(res.negotiate);
    }

    return Team.findOne(user.team)
      .then((teams) => {
        res.send(JsonApiService.serialize('teams', [teams]));
      });
  },

  findOne(req, res) {

    let teamId = req.allParams().id;

    if (req.user.isAdmin === false && req.user.team !== teamId) {
      return res.forbidden();
    }

    let request = Team.findOne(teamId);

    if (req.user.isAdmin === true || req.user.isTeamAdmin) {
      request = request.populate('members').populate('pendingMembers');
    }

    return request
      .then(res.ok)
      .catch(res.negotiate);
  },

  update: function(req, res) {
    return res.forbidden();
  }
};
