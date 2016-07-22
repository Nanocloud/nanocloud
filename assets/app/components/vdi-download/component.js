import Ember from 'ember';
import VdiWindowComponent from '../vdi-window/component';

export default VdiWindowComponent.extend({

  store: Ember.inject.service('store'),
  session: Ember.inject.service('session'),
  download: Ember.inject.service('download'),

  stateUpdated: function() {
    if (this.get('stateVisible') === true) {
      this.loadFiles();
    } 
  }.observes('stateVisible'),

  loadFiles: function() {

    this.get('store').query('file', { filename: "./" })
      .then(function(response) {
        this.set('items', response);
      }.bind(this))
      .catch((err) => {
        // If windows has to be ran once
        if (err.errors.length === 1 && err.errors[0].code === "000008") {
          return ;
        }

        this.toast.error("Couldn't retrieve files");
      });

  }.on('becameVisible'),

  actions: {
    downloadFile: function(filename) {
      this.get('download').downloadFile(this.get('session.access_token'), filename);
    },
  }
});
