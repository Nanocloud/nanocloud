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


/**
 * Reset-passwordController
 *
 * @description :: Server-side logic for managing resetpasswords
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals ConfigService */
/* globals EmailService */
/* globals User */

const uuid          = require('node-uuid');
const bcrypt        = require("bcryptjs");

module.exports = {
  create: function(req, res) {
    const ResetPassword = global['Reset-password'];

    var token;
    var user = req.body.data.attributes;


    // find user via his email address
    if (!user.email) {
      return res.badRequest("Email can not be empty");
    }
    User.findOne({
      "email": user.email
    })
    // generate new reset password token
    .then((user) => {
      if (!user) {
        throw new Error("No user found");
      }
      token = uuid.v4();

      return ResetPassword.create({
        "email": user.email,
        "id": token
      });
    })
    .then(() => {
      return ConfigService.get('host');
    })
    // send him reset password link
    .then((conf) => {
      let subject = 'Nanocloud - Reset your password';
      let message = "Hello,<br>" +
        "We received a request to reset your password.<br>" +
        "<a href='"+conf.host+"/#/reset-password/"+token+"'>" +
        "Reset my password</a><br><br><i>" +
        "If you ignore this message your password won't be changed.</i>";

      // mail sent here
      return EmailService.sendMail(user.email, subject, message);
    })
    .then(() => {
      return res.json({meta: {}});
    })
    .catch((err) => {
      if (err.message === "No user found") {
        return res.notFound(err.message);
      } else if (err.code === 'ECONNECTION') {
        return res.serverError("Please check out your SMTP configuration");
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
      "id": token
    })
    .then((tokenFound) => {
      if (!tokenFound) {
        throw new Error('Token expired');
      }
      token = tokenFound;
      return User.findOne({
        "email": token.email
      });
    })
    // update his password
    .then((user) => {
      if (!user) {
        throw new Error('No user found');
      } else if (!dataReq.password) {
        throw new Error("Password can not be empty");
      }

      let hash = bcrypt.hashSync(dataReq.password, 10);
      return User.update({
        id: user.id
      }, {
        hashedPassword: hash
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
      return res.ok({});
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
