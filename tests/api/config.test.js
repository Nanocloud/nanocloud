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

// jshint mocha:true

var nano = require('./lib/nanotest');
var expect = require('chai').expect;

module.exports = function() {

  describe("Config", function() {

    const setConfigSchema = {
      type: 'object',
      properties: {
        'value': {type: 'string'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'},
      },
      required: ['value', 'created-at', 'updated-at'],
      additionalProperties: false,
    };

    const getConfigSchema = {
      type: 'object',
      properties: {
        'value': {type: 'string'},
      },
      required: ['value'],
      additionalProperties: false,
    };

    it('Should set a test value in configurator', function(done) {

      // user has been added to pending user table
      return nano.request(sails.hooks.http.app)
        .post('/api/configs')
        .set(nano.adminLogin())
        .send({
          data: {
            attributes: {
              key: "test",
              value: true
            },
            type: 'configs'
          }
        })
        .expect(201)
          .expect(nano.jsonApiSchema(setConfigSchema))
          .expect((res) => {
            expect(res.body.data[0].id).to.equal('test');
            expect(res.body.data[0].attributes["value"]).to.equal('true');
          })
        .end(done);
    })

    it('Should return test value from configurator', function(done) {

      // user has been added to pending user table
      return nano.request(sails.hooks.http.app)
        .get('/api/configs?key=test')
        .set(nano.adminLogin())
        .expect(200)
        .expect((res) => {
          expect(res.body.data[0].id).to.equal('test');
          expect(res.body.data[0].attributes["value"]).to.equal('true');
        })
        .expect(nano.jsonApiSchema(getConfigSchema))
        .end(done);
    })
  })
};
