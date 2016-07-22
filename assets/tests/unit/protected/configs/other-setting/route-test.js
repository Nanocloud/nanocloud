import { moduleFor, test } from 'ember-qunit';

moduleFor('route:protected/configs/other-setting', 'Unit | Route | protected/configs/other setting', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it exists', function(assert) {
  let route = this.subject();
  assert.ok(route);
});
