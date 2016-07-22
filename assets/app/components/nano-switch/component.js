import Ember from 'ember';

export default Ember.Component.extend({

  state: Ember.computed('checked', 'checked', function() {
    return this.get('checked') ? "On" : "Off";
  }),

  click() {
    this.toggleProperty('checked');
    this.sendAction('on-switch-change', this.get('checked'));
  },
});
