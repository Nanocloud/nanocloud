import Ember from 'ember';

export default Ember.Route.extend({
  configuration: Ember.inject.service('configuration'),
  setupController(controller, model) {
    controller.set('items', model);
  },
  model() {
    this.get('configuration').loadData();
    return this.store.query('app', {});
  },
  actions: {
    refreshModel() {
      this.refresh();
    }
  }
});
