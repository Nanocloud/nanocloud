import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('vdi-drag-n-drop', 'Integration | Component | vdi drag n drop', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{vdi-drag-n-drop}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#vdi-drag-n-drop}}
      template block text
    {{/vdi-drag-n-drop}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
