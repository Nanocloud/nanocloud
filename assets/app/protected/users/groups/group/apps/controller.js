import Ember from 'ember';
import ArrayDiff from 'nanocloud/lib/array-diff';

export default Ember.Controller.extend({
  groupController: Ember.inject.controller('protected.users.groups.group'),
  groupBinding: 'groupController.model',

  actions: {
    addApp(app) {
      let group = this.get('group');

      group.get('apps').pushObject(app);
      group.save();
    },

    removeApp(app) {
      let group = this.get('group');
      let apps = group.get('apps');

      apps.removeObject(app);
      group.save();
    }
  },

  reset() {
    let applications = this.get('applications');
    let apps = this.get('group.apps');

    let availableApps = ArrayDiff.create({
      major: applications,
      minor: apps
    });

    this.set('availableApps', availableApps);
  }
});
