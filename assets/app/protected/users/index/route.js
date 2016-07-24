import Ember from 'ember';

export default Ember.Route.extend({
    setupController(controller, users) {
      controller.set('items', users);
      controller.activator();
      controller.setData();
    },
    model() {
      return this.store.findAll('user', { reload: true });
    }
});
