import { formatSize } from 'nanocloud/helpers/format-size';
import { module, test } from 'qunit';

module('Unit | Helper | format size');

test('it works', function(assert) {
  let result = formatSize([42]);
  assert.ok(result);
});
