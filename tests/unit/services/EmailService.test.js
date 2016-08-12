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

/* global ConfigService, EmailService */

var expect = require('chai').expect;

describe('EmailService', () => {

  before(function(done) {
    // it takes time to send a mail with nodemailer
    this.timeout(10000);
    ConfigService.set('testMail', true)
    .then(() => {
      return ConfigService.set('smtpSendFrom', 'test@nanocloud.com');
    })
    .then(done);
  });

  it('Should return expected data in envelope', (done) => {
    EmailService.sendMail('otto@protonmail.com', 'subject', 'message')
    .then((res) => {
      expect(res.envelope.from).to.equal('test@nanocloud.com');
      expect(res.envelope.to[0]).to.equal('otto@protonmail.com');
      return done();
    })
    .catch(done);
  });

  after(function() {
    ConfigService.unset('testMail');
  });

});

