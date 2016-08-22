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
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals User, JsonApiService */

module.exports = {

  findOne: function(req, res) {
    return User.findOne(req.allParams().id)
    .populate('groups')
    .then((res.ok))
    .catch(res.negotiate);
  },

  find: function(req, res) {

    if (req.allParams().me === 'true') {
      var me = JsonApiService.serialize('users', req.user);

      return res.send(me);
    }

    return User.find()
      .populate('groups')
      .then(res.ok)
      .catch(res.negotiate);
  }
};
