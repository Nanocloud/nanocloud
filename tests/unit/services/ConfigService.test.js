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

/* global ConfigService, Config */

var Promise = require('bluebird');
var assert = require('chai').assert;
var sails = require('sails');

process.env.iaas = 'dummy';
process.env.machinePoolSize = 3;
process.env.sessionDuration = 0;

describe('Config single Get/Set/Unset', () => {
  it('Should retrieve the recorded value', (done) => {

    (function() {

      return ConfigService.set('host', 'nanocloud')
      .then(() => {
        return ConfigService.get('host');
      })
      .then((res) => {
        assert.deepEqual({ host: 'nanocloud' }, res);

        return ConfigService.unset('host')
        .then(() => {
          return ConfigService.get('host')
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
        ConfigService.set('host', 'nanocloud'),
        ConfigService.set('iaas', 'foo'),
      ])
      .then(() => {
        return ConfigService.get(
          'host', 'iaas'
        );
      })
      .then((res) => {
        assert.deepEqual({
          host: 'nanocloud',
          iaas: 'foo'
        }, res);

        return ConfigService.unset(
          'host', 'iaas'
        )
        .then(() => {
          return ConfigService.get(
            'host', 'iaas'
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

describe('Config overridden value in environment', () => {
  before(function(done) {
    sails.config.nanocloud.nanocloudVar = 'default';
    process.env.NANOCLOUD_VAR = 'overridden';
    ConfigService.init()
      .then(() => {
        return done();
      });
  });
  it('Should retrieve the overridden value', (done) => {
    (function() {
      return ConfigService.get('nanocloudVar')
        .then((res) => {
          assert.deepEqual(res, { nanocloudVar: 'overridden' });
        });
    })()
      .then(() => done()).catch(done);
  });
});


describe('Add new variable in config', () => {

  before(function(done) {
    sails.config.nanocloud.newVar = 'default';
    process.env.NEW_VAR = 'newVar';
    return done();
  });

  after(function(done) {
    Config.destroy({
      key: 'newVar'
    })
      .then(()=> {
        return done();
      });
  });

  it('Should init config values in first up', (done) => {
    ConfigService.init(() => {
      return ConfigService.get('newVar');
    })
      .then((config) => {
        if (config.newVar === 'newVar') {
          return done();
        } else {
          return new Error('The new config value are not in database');
        }
      })
      .catch((err) => {
        return (err);
      });
  });
});

describe('Config should not re-init values that already exist each time backend restart', () => {

  before(function(done) {
    sails.config.nanocloud.newVar = 'default';
    process.env.NEW_VAR = 'shouldBeChange';
    ConfigService.init()
      .then(() => {
        return ConfigService.set('newVar', 'newValue');
      })
      .then(() => {
        return done();
      });
  });

  after(function(done) {
    Config.destroy({
      key: 'newVar'
    })
      .then(()=> {
        return done();
      });
  });

  it('Should not overwrite config values that already exists', (done) => {
    ConfigService.init(() => {
      return ConfigService.get('newVar');
    })
      .then((config) => {
        if (config.newVar === 'newValue') {
          return done();
        } else {
          return new Error('The new config value changed');
        }
      })
      .catch((err) => {
        return (err);
      });
  });
});
