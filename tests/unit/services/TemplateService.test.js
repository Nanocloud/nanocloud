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

/* globals TemplateService, Template*/

const expect = require('chai').expect;

describe('Template Service', function() {
  before(function(done) {
    Template.create({
      key: 'test',
      subject: 'test',
      content: 'This is a {{test}}'
    })
      .then(() => {
        done();
      });
  });

  after(function(done) {
    Template.destroy({
      key: 'test'
    })
      .then(() => {
        done();
      });
  });

  describe('Check email template render', function () {
    it('Should return email subject and email content with appropriate data', function(done) {
      TemplateService.render('test', {test: 'word'})
        .then((template) => {
          expect(template.subject).to.equal('test');
          expect(template.content).to.equal('This is a word');
          done();
        });
    });
  });
});
