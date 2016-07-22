import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('vdi-progress-item', 'Integration | Component | vdi progress item', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{vdi-progress-item}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#vdi-progress-item}}
      template block text
    {{/vdi-progress-item}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
