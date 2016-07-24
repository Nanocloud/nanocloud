import Ember from 'ember';

export default Ember.Route.extend({
  setupController(controller) {
    controller.set('passwordConfirmation', "");
    controller.set('model', this.store.createRecord('user', {}));
  }
});
