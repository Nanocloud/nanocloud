import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['machine'],
  machine: null,

  shouldEnableLightBulb: Ember.computed('machine.status', function() {
    if (this.get('machine.status') !== 'down') {
      return true;
    }
    return false;
  }),

  displayCountdown: Ember.computed('machine.countdownTimeleft', function() {
    return this.get('machine.countdownTimeleft') > 0 ? true : false;
  }),
});
