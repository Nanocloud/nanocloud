import Ember from 'ember';

export default Ember.Route.extend({

  session: Ember.inject.service('session'),
  setupContoller(controller, model) {
    controller.set('drivers', model);
  },
  model() {
    if (this.get('session.user.isAdmin')) {
      return this.store.findAll('machine-driver');
    }
    return [];
  }
});
