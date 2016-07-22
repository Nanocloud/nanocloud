import Ember from 'ember';

export default Ember.Component.extend({

  waitForCancel: false,

  progress: Ember.computed('file.content.current_progress', function() {
    return this.get('file.content').current_progress;
  }),

  uploading: Ember.computed('file.content.current_progress', function() {
    return this.get('file.content').isUploading();
  }),

  completed: Ember.computed('file.content.current_progress', function() {
    return this.get('file.content').current_progress === 1;
  }),

  stopUpload() {
    this.get('file.content').cancel();
    this.sendAction('cancelSingleUpload');
  },

  actions: {
    cancel() {
      this.set('waitForCancel', true);
      this.stopUpload();
    }
  },
});
