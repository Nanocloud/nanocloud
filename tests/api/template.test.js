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

/* globals sails, Template */

const nano = require('./lib/nanotest');
const expect = require('chai').expect;

module.exports = function() {

  describe('Template', function() {

    let templateId = null;

    before(function(done) {
      Template.create({
        key: 'key',
        subject: 'Subject',
        content: 'Content'
      })
        .then((template) => {
          templateId = template.id;
          return Template.create({
            key: 'test',
            subject: 'test',
            content: 'test'
          });
        })
        .then(() => {
          done();
        });
    });

    after(function(done) {
      Template.destroy({
        id: templateId
      })
        .then(() => {
          done();
        });
    });

    const expectedSchema = {
      type: 'object',
      properties: {
        key: {type: 'string'},
        subject: {type: 'string'},
        content: {type: 'string'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'},
      },
      required: ['key', 'subject', 'content', 'created-at', 'updated-at'],
      additionalProperties: false
    };

    describe('Update templates', function() {

      it('Should correctly update template', function(done) {
        return nano.request(sails.hooks.http.app)
          .patch('/api/templates/' + templateId)
          .set(nano.adminLogin())
          .send({
            data: {
              attributes: {
                key: 'newKey',
                subject: 'New subject',
                content: 'New content'
              },
              id: templateId,
              type: 'templates'
            }
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.attributes.key).to.equal('newKey');
            expect(res.body.data.attributes.subject).to.equal('New subject');
            expect(res.body.data.attributes.content).to.equal('New content');
          })
          .end(done);
      });

      describe('Get templates', function() {
        it('Should return a list of templates', function(done) {
          return nano.request(sails.hooks.http.app)
            .get('/api/templates')
            .set(nano.adminLogin())
            .expect(200)
            .expect(nano.jsonApiSchema(expectedSchema))
            .end(done);
        });
      });
    });
  });
};
