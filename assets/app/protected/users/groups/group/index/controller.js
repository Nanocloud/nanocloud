import Ember from 'ember';

export default Ember.Controller.extend({
  groupName: '',
  renaming: false,
  showModal: false,
  groupNameConfirm: '',

  reset() {
    this.setProperties({
      groupName: this.get('model.name'),
      renaming: false,
      showModal: false,
      groupNameConfirm: '',
    });
  },

  preventRenaming: Ember.computed('groupName', 'model.name', function() {
    let groupName = this.get('groupName').trim();
    return this.get('renaming') || !groupName || groupName === this.get('model.name');
  }),

  preventDeletion: Ember.computed('groupNameConfirm', 'model.name', function() {
    return this.get('groupNameConfirm') !== this.get('model.name');
  }),

  actions: {
    toggleModal() {
      this.set('groupNameConfirm', '');
      this.toggleProperty('showModal');
    },

    deleteGroup() {
      if (!this.get('preventDeletion')) {
        let group = this.get('model');
        group.destroyRecord()
        .then(() => {
          this.transitionToRoute('protected.users.groups');
          this.toast.success('The group has been deleted');
        });
      }
    },

    renameGroup() {
      this.set('renaming', true);

      let group = this.get('model');
      group.set('name', this.get('groupName').trim());
      group
      .save()
      .then(() => {
        this.toast.success('The group has been renamed');
      })
      .finally(() => this.set('renaming', false));
    }
  }
});
