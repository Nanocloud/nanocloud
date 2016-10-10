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

/* global App, sails */

var nano = require('./lib/nanotest');
var expect = require('chai').expect;

module.exports = function() {

  describe('Histories', function() {

    const expectedSchema = {
      type: 'object',
      properties: {
        'user-mail': {type: 'string'},
        'user-id': {type: 'string'},
        'user-firstname': {type: 'string'},
        'user-lastname': {type: 'string'},
        'connection-id': {type: 'string'},
        'start-date': {type: 'string'},
        'end-date': {type: 'string'},
        'machine-id': {type: 'string'},
        'machine-driver': {type: 'string'},
        'machine-type': {type: ['string', 'null']},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'}
      },
      required: ['user-mail','user-id','user-firstname','user-lastname','connection-id','start-date','end-date','machine-id','machine-driver','created-at','updated-at'],
      additionalProperties: false
    };

    it('Should create history', (done) => {
      App.findOne({
        alias: 'Desktop'
      })
        .then((app) => {
          nano.request('http://localhost:1337')
            .post('/api/histories')
            .send({
              data: {
                attributes: {
                  'user-mail': 'admin@nanocloud.com',
                  'user-id': 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
                  'user-firstname': 'Admin',
                  'user-lastname': 'Nanocloud',
                  'connection-id': app.id,
                  'start-date': 'Wed Jul 21 14:10:00 UTC 2016',
                  'end-date': ''
                },
                type: 'histories'
              }
            })
            .expect(201)
            .expect(nano.jsonApiSchema(expectedSchema))
            .then(() => {
              return nano.request(sails.hooks.http.app)
                .get('/api/histories')
                .set(nano.adminLogin())
                .expect(200)
                .expect(nano.jsonApiSchema(expectedSchema))
                .expect((res) => {
                  expect(res.body.data[0].attributes['start-date']).to.equal('Wed Jul 21 14:10:00 UTC 2016');
                })
                .then((res) => {
                  return nano.request('http://localhost:1337')
                    .post('/api/histories/' + res.body.data[0].id)
                    .send({
                      data: {
                        attributes: {
                          'user-mail': 'admin@nanocloud.com',
                          'user-id': 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
                          'user-firstname': 'Admin',
                          'user-lastname': 'Nanocloud',
                          'connection-id': app.id,
                          'start-date': 'Wed Jul 21 14:10:00 UTC 2016',
                          'end-date': 'Wed Jul 21 14:20:00 UTC 2016'
                        },
                        type: 'histories'
                      }
                    })
                    .expect(200)
                    .expect(nano.jsonApiSchema(expectedSchema))
                    .expect((res) => {
                      expect(res.body.data.attributes['end-date']).to.equal('Wed Jul 21 14:20:00 UTC 2016');
                    })
                    .then(() => {
                      return done();
                    });
                });
            });
        });
    });

    it('Should not found a wrong connection ID', (done) => {
      nano.request('http://localhost:1337')
        .post('/api/histories')
        .send({
          data: {
            attributes: {
              'user-mail': 'admin@nanocloud.com',
              'user-id': 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              'user-firstname': 'Admin',
              'user-lastname': 'Nanocloud',
              'connection-id': 'wrong connection id',
              'start-date': 'Wed Jul 21 14:10:00 UTC 2016',
              'end-date': ''
            },
            type: 'histories'
          }
        })
        .expect(404)
        .then(() => {
          return done();
        });
    });
  });
};
