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

/* globals Machine, sails */

const nano = require('./lib/nanotest');
const expect = require('chai').expect;

module.exports = function() {

  describe('Session', function() {

    const expectedSchema = {
      type: 'object',
      properties: {
        'username': {type: 'string'},
        'state': {type: 'string'},
        'user-id': {type: ['string', 'null']},
        'machine-id': {type: ['string', 'null']}
      },
      required: ['username', 'state'],
      additionalProperties: false
    };

    describe('List sessions', function() {
      it('Should return a list of inactive sessions', function(done) {

        nano.request(sails.hooks.http.app)
        .get('/api/sessions')
        .set(nano.adminLogin())
        .expect(200)
        .expect(nano.jsonApiSchema(expectedSchema))
        .expect((res) => {
          expect(res.body.data.length).to.be.at.least(1);
          expect(res.body.data[0].attributes.state).to.equal('Inactive');
        })
        .end(done);
      });
    });

    describe('Delete current user\'s session', function() {
      it('Should end user\'s session', function(done) {
        Machine.find()
          .then((machines) => {
            nano.request(sails.hooks.http.app)
              .delete('/api/sessions')
              .send({
                machineId: machines[0].id
              })
              .set(nano.adminLogin())
              .expect(200)
              .expect((res) => {
                expect(res.body).to.have.property('meta');
              })
              .end(done);
          });
      });
    });
  });
};
