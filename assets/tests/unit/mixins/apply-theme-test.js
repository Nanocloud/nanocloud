import Ember from 'ember';
import ApplyThemeMixin from 'nanocloud/mixins/apply-theme';
import { module, test } from 'qunit';

module('Unit | Mixin | apply theme');

// Replace this with your real tests.
test('it works', function(assert) {
  let ApplyThemeObject = Ember.Object.extend(ApplyThemeMixin);
  let subject = ApplyThemeObject.create();
  assert.ok(subject);
});
