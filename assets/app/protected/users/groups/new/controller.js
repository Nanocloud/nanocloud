import Ember from 'ember';

export default Ember.Controller.extend({
  loadState: false,
  reset() {
    this.set('groupName', '');
  },

  preventCreation: Ember.computed('groupName', function() {
    return !this.get('groupName').trim();
  }),

  actions: {
    createGroup() {
      let name = this.get('groupName').trim();

      let group = this.store.createRecord('group', {
        name
      });
      this.set('loadState', true);
      group
      .save()
      .then(() => {
        this.transitionToRoute('protected.users.groups');
        this.toast.success("Your group has breen created");
      })
      .catch(() => {
        this.toast.error("Group could not be created");
      })
      .finally(() => {
        this.set('loadState', false);
      });
    }
  }
});
