import Ember from 'ember';

export default Ember.Controller.extend({
  applicationController: Ember.inject.controller('application'),

  activeTab: Ember.computed('applicationController.currentRouteName', function() {
    let name = this.get('applicationController.currentRouteName');
    return (name.indexOf('protected.users.') === 0 && name.indexOf('.groups') !== 15);
  })
});
