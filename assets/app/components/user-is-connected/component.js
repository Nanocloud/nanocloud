import Ember from 'ember';

export default Ember.Component.extend({

  userIsConnected: function() {
    if (!this.get('sessions')) {
      return ;
    }
    if (this.get('sessions').filterBy('userId', this.get('userId')).length === 0) {
      return false;
    }
    else {
      return true;
    }
  }.property('sessions'),

  userIsConnectedStatus: Ember.computed('userIsConnected', function() {
    return this.get('userIsConnected') ? 'up' : 'down';
  }),

  tooltipMessage: function() {
    if (this.get('userIsConnected') === true) {
      return "User is online";
    }
    return "User is offline";
  }.property('userIsConnected'),
});
