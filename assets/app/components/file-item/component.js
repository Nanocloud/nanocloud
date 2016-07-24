import Ember from 'ember';

export default Ember.Component.extend({

  actions : {
    
    triggerDownload(filename) {
      this.sendAction('download', filename);
    }
  }
});
