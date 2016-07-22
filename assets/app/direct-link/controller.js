import Ember from 'ember';

export default Ember.Controller.extend({

  remoteSession: Ember.inject.service('remote-session'),
  showSingleTab: true,

  actions: {
    disconnectGuacamole() {
      this.get('remoteSession').disconnectSession(this.get('connectionName'));
      this.toggleProperty('showSingleTab');
    },
  }
});

