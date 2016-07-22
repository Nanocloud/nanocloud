import Ember from 'ember';
import PropertiesInitializer from 'nanocloud/initializers/properties';
import { module, test } from 'qunit';

let application;

module('Unit | Initializer | properties', {
  beforeEach() {
    Ember.run(function() {
      application = Ember.Application.create();
      application.deferReadiness();
    });
  }
});

// Replace this with your real tests.
test('it works', function(assert) {
  PropertiesInitializer.initialize(application);

  // you would normally confirm the results of the initializer here
  assert.ok(true);
});
