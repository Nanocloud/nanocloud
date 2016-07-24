import Ember from 'ember';

export default Ember.Route.extend({

  queryParams: {
   app: {
      refreshModel: true
    }
  },

  setupController(controller) {
    controller.reset();
    this.get('configuration').loadData();
    this._super(...arguments);
  },
  configuration: Ember.inject.service('configuration')
});
