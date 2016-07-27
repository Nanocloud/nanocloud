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

/* global ConfigService */

var Promise = require('bluebird');
var assert = require('chai').assert;
var sails = require('sails');

process.env.IAAS = 'dummy';

before(function(done) {

  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(5000);

  sails.lift({
    models: {
      migrate: 'drop'
    }
  }, (err) => {

    if (err) {
      throw new Error(err);
    }

    ConfigService.init()
    .then(() => {
      return done(null, sails);
    }, done);

  });
});

describe('Config single Get/Set/Unset', () => {
  it('Should retrieve the recorded value', (done) => {

    (function() {

      return ConfigService.set('NANOCLOUD', 'nanocloud')
      .then(() => {
        return ConfigService.get('NANOCLOUD');
      })
      .then((res) => {
        assert.deepEqual({ NANOCLOUD: 'nanocloud' }, res);

        return ConfigService.unset('NANOCLOUD')
        .then(() => {
          return ConfigService.get('NANOCLOUD')
          .then((res) => {
            assert.deepEqual({}, res);
          });
        });
      });

    })()

    .then(() => done()).catch(done);

  });
});

describe('Config multiple Get/Set/Unset', () => {
  it('Should retrieve the recorded values', (done) => {

    (function() {

      return Promise.all([
        ConfigService.set('NANOCLOUD', 'nanocloud'),
        ConfigService.set('FOO', 'foo'),
        ConfigService.set('BAR', 'bar'),
        ConfigService.set('BAZ', 'baz')
      ])
      .then(() => {
        return ConfigService.get(
          'NANOCLOUD', 'FOO', 'BAR', 'BAZ'
        );
      })
      .then((res) => {
        assert.deepEqual({
          NANOCLOUD: 'nanocloud',
          FOO: 'foo',
          BAR: 'bar',
          BAZ: 'baz'
        }, res);

        return ConfigService.unset(
          'NANOCLOUD', 'FOO', 'BAR', 'BAZ'
        )
        .then(() => {
          return ConfigService.get(
            'NANOCLOUD', 'FOO', 'BAR', 'BAZ'
          )
          .then((res) => {
            assert.deepEqual({}, res);
          });
        });
      });

    })()

    .then(() => done()).catch(done);

  });
});
