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
 * ConfigController
 *
 * @description :: Server-side logic for managing configs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals ConfigService */
/* globals EmailService */
/* globals PendingUser */
/* globals JsonApiService */
/* globals User */

const uuid = require('node-uuid');

module.exports = {

  create: function(req, res) {

    ConfigService.get(
      'host'
    )
    .then((configuration) => {
      var host = configuration.host;
      var user = req.body.data.attributes;
      user.id = uuid.v4();
      user["isAdmin"] = false;
      var to =  user.email;
      var subject = 'Nanocloud - Verify your email address';
      var message = 'Hello ' + user["first-name"] + ' ' + user["last-name"] + ',<br> please verify your email address by clicking this link: '+
          '<a href="'+host+'/#/activate/'+user.id+'">Activate my account</a>';

      EmailService.sendMail(to, subject, message)
      .then(() => {
        return PendingUser.create(JsonApiService.deserialize(user));
      })
      .then((created_user) => {
        return res.created(created_user);
      });
    })
    .catch((err) => {
      return res.negotiate(err);
    });
  },

  update: function(req, res) {
    let pendingUserID = req.params.id;
    PendingUser.findOne({
      "id": pendingUserID
    })
    .then((user) => {
      if (!user) {
        return res.notFound('No user found');
      }
      User.create(user)
      .then(() => {
          return PendingUser.destroy({
            "id": pendingUserID
          });
        })
      .then(() => {
        return res.ok(user);
      });
    })
    .catch(() => {
      return res.notFound('An error occured while retrieving user');
    });
  } 
};
