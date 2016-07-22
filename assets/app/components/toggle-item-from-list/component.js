import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    switchChange(switchState) {
      if (switchState) {
        this.sendAction('addAction', this.get('item'));
      }
      else {
        this.sendAction('removeAction', this.get('item'));
      }
    }
  }
});
