import getKeyFromValue from 'nanocloud/utils/get-key-from-value';
import { module, test } from 'qunit';

module('Unit | Utility | get key from value');

var map = {
  "object1": "value1",
  "object2": "value2",
  "object3": "value3",
  "object4": "value4",
};


// Replace this with your real tests.
test('it should return the key for a value that exists', function(assert) {

  let result = getKeyFromValue(map, "value2");
  assert.equal(result, "object2");
});

test('it should return -1 if value was not found', function(assert) {

  let result = getKeyFromValue(map, "value0");
  assert.equal(result, -1);
});
