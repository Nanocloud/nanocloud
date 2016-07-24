import Ember from 'ember';

export default Ember.Route.extend({
  setupContoller(controller, model) {
    controller.set('drivers', model);
  },
  model() {
    return this.store.findAll('machine-driver');
  },
  actions: {
    willTransition: function() {
      this.controller.reset();
    }
  }
});
