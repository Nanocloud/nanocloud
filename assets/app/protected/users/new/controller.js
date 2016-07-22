import Ember from 'ember';

export default Ember.Controller.extend({

  passwordConfirmation: null,
  loadState: false,
  userHasSubmitted: false,

  actions: {
    add() {
      this.set('userHasSubmitted', true);
      this.model
        .validate()
        .then(({ m, validations }) => {

          if (validations.get('isInvalid') === true) {
            return this.toast.error('Cannot create user');
          }

          this.set('loadState', true);
          this.model.save()
            .then(() => {
              this.set('loadState', false);
              this.transitionToRoute('protected.users');
              this.toast.success('User has been created sucessfully');
            }, (errorMessage) => {
              this.set('loadState', false);
              this.toast.error('Cannot create new user : ' + errorMessage);
            });
        });
    }
  }
});
