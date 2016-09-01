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

/* globals ConfigService, EmailService, PendingUser, JsonApiService, User */
/* globals TemplateService */

const Promise = require('bluebird');
const uuid    = require('node-uuid');
const moment  = require('moment');
const _       = require('lodash');

module.exports = {

  create(req, res) {
    var user = req.body.data.attributes;

    user.id = uuid.v4();
    user.isAdmin = false;

    User.findOne({
      email: user.email
    })
      .then((userResponse) => {
        if (!userResponse) {
          return PendingUser.findOne({
            email: user.email
          });
        }

        return Promise.reject(new Error('User already exists'));
      })
      .then((pendingUserResponse) => {
        if (!pendingUserResponse) {
          return ConfigService.get('host');
        }

        return Promise.reject(new Error('User already exists'));
      })
      .then((configuration) => {
        var host = configuration.host;
        var to =  user.email;
        var subject = 'Nanocloud - Verify your email address';

        return TemplateService.render('activation-email', {
          firstName: user['first-name'],
          lastName: user['last-name'],
          activationLink: `http://${host}/#/activate/${user.id}`
        })
          .then((message) => {
            return EmailService.sendMail(to, subject, message)
              .then(() => {
                let userToAdd = JsonApiService.deserialize(user);
                let teamId = _.get(req.body, 'data.relationships.team.data.id');

                if (teamId) {
                  userToAdd.team = teamId;
                }

                return PendingUser.create(userToAdd);
              })
              .then((created_user) => {
                return res.created(created_user);
              });
          });
      })
      .catch((err) => {
        if (err.code === 'ECONNECTION') {
          return res.serverError('Cannot connect to SMTP server');
        } else if (err.message === 'User already exists') {
          return res.badRequest('User already exists');
        }
        return res.negotiate(err);
      });
  },

  update: function(req, res) {
    var pendingUserID = req.params.id;
    var expirationDays;

    ConfigService.get('expirationDate')
      .then((conf) => {
        expirationDays = conf.expirationDate;
        return PendingUser.findOne({
          id: pendingUserID
        });
      })
      .then((user) => {
        if (!user) {
          return res.notFound('No user found');
        }
        user.expirationDate = (expirationDays) ? moment(new Date()).add(expirationDays, 'days').unix() : null;
        User.create(user)
          .then((user) => {
            return ConfigService.get('defaultGroup')
              .then((config) => {
                return new Promise((resolve) => {
                  if (config.defaultGroup !== '') {
                    user.groups.add(config.defaultGroup);
                    user.save((err) => {
                      return resolve(err);
                    });
                  } else {
                    return resolve();
                  }
                });
              });
          })
          .then(() => {
            return PendingUser.destroy({
              id: pendingUserID
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
