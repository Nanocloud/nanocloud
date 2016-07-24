import Ember from 'ember';

export default Ember.Route.extend({
	setupController(controller) {
      controller.set('model', this.store.createRecord('reset-password-token', {}));
    }
});
