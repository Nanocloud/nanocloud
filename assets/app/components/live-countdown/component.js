import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['live-countdown'],
  originalValue : Ember.computed.oneWay('value'),
  currentCountdown:  Ember.computed.alias('value'),
  decrementLoopEnabled: false,
  timeFormat: Ember.computed('isTime', 'currentCountdown', function() {
    return window.humanizeDuration(this.get('currentCountdown') * 1000);
  }),

  init() {
    this._super(...arguments);
    this.set('decrementLoopEnabled', true);
    Ember.run(() => { 
      this.set('interval', setInterval(this.get('decrementCountdown').bind(this), 1000));
    });
  },

  willDestroy() {
    clearInterval(this.get('interval'));
  },

  countdownLoop: function() {
    if (this.get('currentCountdown') === 0 && this.get('decrementLoopEnabled')) {
      this.set('decrementLoopEnabled', false);
      clearInterval(this.get('interval'));
    }
  }.observes('currentCountdown'),

  decrementCountdown() {
    this.set('currentCountdown', this.get('currentCountdown') - 1);
  }
});
