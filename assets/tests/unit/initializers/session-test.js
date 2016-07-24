import Ember from 'ember';
import SessionInitializer from 'nanocloud/initializers/session';
import { module, test } from 'qunit';

let application;

module('Unit | Initializer | session', {
  beforeEach() {
    Ember.run(function() {
      application = Ember.Application.create();
      application.deferReadiness();
    });
  }
});

// Replace this with your real tests.
test('it works', function(assert) {
  SessionInitializer.initialize(application);

  // you would normally confirm the results of the initializer here
  assert.ok(true);
});
