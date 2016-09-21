import Ember from 'ember';

export default Ember.Route.extend({

  setupController(controller, model) {
    let newModel = model.filterBy('key', 'activation').objectAt(0);
    let newContent = newModel.get('content').split(/{/).join('[').split(/}/).join(']');
    newModel.set('content', newContent);
    controller.set('template', newContent);
    controller.set('model', newModel);
  },

  model() {
    return this.store.query('template', {});
  }
});
