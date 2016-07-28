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

/* globals ConfigService */

const nodemailer  = require('nodemailer');
const stubTransport = require('nodemailer-stub-transport');

function sendMail(to, subject, message) {

  return ConfigService.get('testSendMail', 'smtpServerHost', 'smtpServerPort', 'smtpLogin', 'smtpPassword', 'smtpSendFrom')
    .then((res) => {
      var smtpConfig = {
        host: res.smtpServerHost,
        port: res.smtpServerPort,
        auth: {
          user: res.smtpLogin,
          pass: res.smtpPassword
        }
      };

      if (res.testSendMail) {
        smtpConfig = stubTransport();
      }

      var transporter = nodemailer.createTransport(smtpConfig);   
      var mailOptions = {
        from: '"Nanocloud" <' + res.smtpSendFrom + '>', // sender address
        to: to, // list of receivers seperated by a comma
        subject: subject, // Subject line
        html: message
      };
      return transporter.sendMail(mailOptions);
    });
}

module.exports = { sendMail };
