import Ember from 'ember';

export default Ember.Route.extend({
  setupController(controller, model) {
    controller.set('items', model);
    controller.setData();
  },

  model() {
    var model = this.store.query('history', {});
    this.controllerFor('protected.histories.index').setData();
    return model;
  },

  actions: {
    refreshModel() {
      this.refresh();
    }
  }
});
