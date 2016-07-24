import Ember from 'ember';

export default Ember.Route.extend({
  setupController(controller, model) {
    controller.set('users', model.toArray());
    controller.reset();
  },

  model() {
    return this.store.findAll('user', { reload: true });
  }
});
