import { moduleFor, test } from 'ember-qunit';

moduleFor('route:protected/configs/email-configuration/forget-password', 'Unit | Route | protected/configs/email configuration/forget password', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it exists', function(assert) {
  let route = this.subject();
  assert.ok(route);
});
