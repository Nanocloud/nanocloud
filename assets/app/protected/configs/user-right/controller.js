import Ember from 'ember';
export default Ember.Controller.extend({
  configController: Ember.inject.controller('protected.configs'),
  defaultGroup: Ember.computed.alias('configController.defaultGroup'),
  actions: {
    selectGroup(id) {
      this.get('configController').send('selectGroup', id);
    },
  }
});
