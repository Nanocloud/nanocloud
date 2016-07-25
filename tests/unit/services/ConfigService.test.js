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
