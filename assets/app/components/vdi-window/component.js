import Ember from 'ember';

export default Ember.Component.extend({

  remoteSession: Ember.inject.service('remote-session'),

  inputFocusChanged: function() {

    var inputs = ['textarea', 'input'];

    for (let i = 0; i < inputs.length; i++) {
      if (this.$().find(inputs[i]).length !== 0) {
        this.$().find(inputs[i])
          .focusin(function() {
            this.get('remoteSession').pauseInputs(this.get('connectionName'));
          }.bind(this))
          .focusout(function() {
            this.get('remoteSession').restoreInputs(this.get('connectionName'));
          }.bind(this));
      }
    }
  }.on('didInsertElement'),


  actions: {
    toggleVdiWindow() {
      if (this.get('toggleWindow')) {
        this.toggleWindow();
      }
      else {
        this.toggleProperty('stateVisible');
      }
    },
  }
});
