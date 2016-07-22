import Ember from 'ember';

export default Ember.Route.extend({
  setupController(controller, model) {
    controller.set('applications', model.toArray());
    controller.reset();
  },

  model() {
    return this.store.findAll('app', { reload : true });
  }
});
