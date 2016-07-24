import Ember from 'ember';

export default Ember.Controller.extend({


  publicationDate: Ember.computed(function() {
    console.log(this.get('model.publicationDate'));
    return window.moment(new Date(this.get('model.publicationDate'))).format('MMMM Do YYYY, h:mm:ss A');
  }),

  saveAppName: function() {
    if (Ember.isPresent( this.get('model').changedAttributes().displayName)) {
      this.get('model').save()
      .then(() => {
        this.toast.success("Application name has been updated successfully!");
      })
      .catch((reason) => {
        this.toast.error(reason.errors[0].title);
        this.get('model').rollbackAttributes();
      });
    }
  }.observes('model.displayName'),

  preventDeletion: Ember.computed('appNameConfirm', 'model.displayName', function() {
    return this.get('appNameConfirm') !== this.get('model.displayName');
  }),

  actions: {

    toggleModal() {
      this.set('appNameConfirm', '');
      this.toggleProperty('showModal');
    },

    deleteApp() {
      if (!this.get('preventDeletion')) {
        let app = this.get('model');
        app.destroyRecord()
        .then(() => {
          this.send('toggleModal');
          this.transitionToRoute('protected.apps');
          this.toast.success('The application has been deleted');
        })
        .catch((reason) => {
          this.toast.error(reason.errors[0].title);
        });
      }
    },
  }
});
