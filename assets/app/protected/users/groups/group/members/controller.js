import Ember from 'ember';

import ArrayDiff from 'nanocloud/lib/array-diff';

export default Ember.Controller.extend({
  groupController: Ember.inject.controller('protected.users.groups.group'),
  groupBinding: 'groupController.model',

  actions: {
    addMember(user) {
      let group = this.get('group');
      group.get('members').pushObject(user);
      group.save();
    },

    removeMember(user) {
      let group = this.get('group');
      let members = group.get('members');

      members.removeObject(user);
      group.save();
    },
  },

  reset() {
    let users = this.get('users');
    let members = this.get('group.members');

    let nonMembers = ArrayDiff.create({
      major: users,
      minor: members
    });

    this.set('nonMembers', nonMembers);
  }
});
