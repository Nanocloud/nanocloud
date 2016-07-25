/**
 * Nanocloud, a comprehensive platform to turn any application into a cloud
 * solution.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud.
 *
 * Nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

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
