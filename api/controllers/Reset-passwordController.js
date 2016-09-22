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

/* globals ConfigService, EmailService, User, TemplateService */

const uuid = require('node-uuid');

module.exports = {
  create: function(req, res) {
    const ResetPassword = global['Reset-password'];

    var token;
    let user = null;

    // find user via his email address
    if (!req.body.data.attributes.email) {
      return res.badRequest('Email can not be empty');
    }
    return User.findOne({
      email: req.body.data.attributes.email
    })
    // generate new reset password token
      .then((usr) => {
        if (!usr) {
          throw new Error('No user found');
        }
        user = usr;
        token = uuid.v4();

        return ResetPassword.create({
          email: user.email,
          id: token
        });
      })
      .then(() => {
        return ConfigService.get('host');
      })
    // send him reset password link
      .then((configuration) => {
        let host = configuration.host;
        let to = user.email;

        return TemplateService.render('reset', {
          firstName: user.firstName,
          lastName: user.lastName,
          resetLink: `http://${host}/#/reset-password/${token}`
        })
          .then((template) => {
            // mail sent here
            return EmailService.sendMail(to, template.subject, template.content);
          });
      })
      .then(() => {
        return res.json({meta: {}});
      })
      .catch((err) => {
        if (err.message === 'No user found') {
          return res.notFound(err.message);
        } else if (err.code === 'ECONNECTION') {
          return res.serverError('Please check out your SMTP configuration');
        }
        return res.negotiate(err);
      });
  },

  update: function(req, res) {
    const ResetPassword = global['Reset-password'];

    var token    = req.params.id;
    var dataReq  = req.body.data.attributes;

    // find user
    ResetPassword.findOne({
      id: token
    })
    .then((tokenFound) => {
      if (!tokenFound) {
        throw new Error('Token expired');
      }
      token = tokenFound;
      return User.findOne({
        email: token.email
      });
    })
    // update his password
    .then((user) => {
      if (!user) {
        throw new Error('No user found');
      } else if (!dataReq.password) {
        throw new Error('Password can not be empty');
      }

      return User.update({
        id: user.id
      }, {
        password: dataReq.password
      });
    })
    // destroy the reset password token
    .then(() => {
      return ResetPassword.destroy({
        id: token.id
      });
    })
    // return response
    .then(() => {
      return res.json({meta: {}});
    })
    .catch((err) => {
      if (err.message === 'No user found') {
        return res.notFound(err.message);
      } else if (err.message === 'Password can not be empty') {
        return res.badRequest(err.message);
      } else if (err.message === 'Token has expired') {
        return res.serverError(err.message);
      }
      return res.negotiate(err);
    });
  }
};
