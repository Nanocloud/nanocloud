import Ember from 'ember';
import SearchModelTableMixin from 'nanocloud/mixins/search-model-table';
import { module, test } from 'qunit';

module('Unit | Mixin | search model table');

// Replace this with your real tests.
test('it works', function(assert) {
  let SearchModelTableObject = Ember.Object.extend(SearchModelTableMixin);
  let subject = SearchModelTableObject.create();
  assert.ok(subject);
});
