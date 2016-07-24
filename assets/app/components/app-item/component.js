import Ember from 'ember';

export default Ember.Component.extend({

    application: null,
    isEditing: false,
    connectionName: null,
    showSingleTab: false,
    session: Ember.inject.service('session'),
    unpublishState: false,
    isUnpublished: false,

    actions : {

      toggleSingleTab(connectionName) {
        if (this.get('isEditing') === false) {
          this.set('connectionName', connectionName);
          this.toggleProperty('showSingleTab');
        }
      },

      toggleEditName() {
        this.toggleProperty('isEditing');
      },

      submitEditName(defer) {
        this.get('application').validate()
          .then(({
            model, validations
          }) => {
            if (validations.get('isInvalid')) {
              this.toast.error('Cannot change application name');
              return defer.reject(this.get('application.validations.attrs.displayName.messages'));
            }

            this.application.save()
              .then(() => {
                this.toggleProperty('isEditing');
                this.toast.success("Application has been renamed successfully");
                defer.resolve();
              })
              .catch(() => {
                this.toast.error("Application hasn't been renamed");
                defer.reject();
              });
          })
          .catch(() => {
            this.toast.error("Unknown error while rename application");
            defer.reject();
          });
      },

      cancelEditMode() {
        this.set('isEditing', false);
      },

      unpublish() {
        this.set('unpublishState', true);
        this.application.destroyRecord()
          .then(() => {
            this.toast.success("Application has been unpublished successfully");
            this.set('unpublishState', false);
            this.set('isUnpublished', true);
          }, () => {
            this.toast.error("Application hasn't been unpublished");
            this.set('unpublishState', false);
          });
      }
    }
});
