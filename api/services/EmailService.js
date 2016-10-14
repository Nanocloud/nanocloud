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

/* globals sails, ConfigService */

const nodemailer  = require('nodemailer');
const stubTransport = require('nodemailer-stub-transport');

/**
 * Send a email and return a promise
 * @method sendMail
 * @public
 * @param {String} receiver email address
 * @param {String} subject
 * @param {String} email content
 * @return {Promise[Object]} A promise that resolves nodeMailer.sendMail
 */
function sendMail(to, subject, message) {

  return ConfigService.get('testMail', 'smtpServerHost', 'smtpServerPort', 'smtpLogin', 'smtpPassword', 'smtpSendFrom')
    .then((configs) => {
      var smtpConfig = {
        host: configs.smtpServerHost,
        port: configs.smtpServerPort,
        auth: {
          user: configs.smtpLogin,
          pass: configs.smtpPassword
        }
      };

      if (configs.testMail === true) {
        sails.log.info('Mail sender set to test mode.');
        smtpConfig = stubTransport();
      }

      sails.log.info('Creating transporter....');
      let transporter = nodemailer.createTransport(smtpConfig);
      sails.log.info('Transporter created....');
      sails.log.info('Verifying SMTP...');
      let verified_transporter = transporter.verify();

      // verifying smtpConfig before sending a mail
      if (verified_transporter !== false) {
        sails.log.info('SMTP verified...');
        return verified_transporter
          .then(() => {
            return sendMailOption(transporter);
          });
      } else {
        // test scenario. just send a mail
        sails.log.info('SMTP verification failed...');
        return sendMailOption(transporter);
      }

      function sendMailOption(transporter) {
        var mailOptions = {
          from: '"Nanocloud" <' + configs.smtpSendFrom+ '>',
          to: to,
          subject: subject,
          html: message
        };
        sails.log.info('Sending email...');
        return transporter.sendMail(mailOptions);
      }
    });
}

module.exports = { sendMail };
