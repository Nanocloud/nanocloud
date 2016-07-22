import Ember from 'ember';

export default Ember.Component.extend({
  tmpValue: Ember.computed.oneWay('value'),
  classNames: 'confirm-input',

  isModified: Ember.computed('value', 'tmpValue', function() {
    return this.get('value') !== this.get('tmpValue');
  }),

  keyDown(event) {
    if (event.key === 'Escape') {
      this.resetValue();
      event.stopPropagation();
      return false;
    }
    return true;
  },

  resetValue: function() {
    this.set('tmpValue', this.get('value'));
    this.$().find('input').focus();
  },

  actions: {
    focusIn: function() {
      this.set('focus', true);
    },
    focusOut: function() {
      this.set('focus', false);
    },
    saveValue: function() {
      this.set('value', this.get('tmpValue'));
    },
    resetValue: function() {
      this.resetValue();
    }
  }
});
