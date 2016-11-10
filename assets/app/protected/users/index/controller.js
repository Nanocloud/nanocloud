/**
 * Nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
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
  configController: Ember.inject.controller('protected.configs'),

  store: Ember.inject.service('store'),
  activator: function() {
    this.set('loadState', true);
    this.get('store')
      .query('session', {})
      .then((sessions) => {
        this.set('loadState', false);
        this.set('sessions', sessions);
      })
      .catch(() => {
        this.set('loadState', true);
      });
  },

  modelIsEmpty: Ember.computed.empty('model'),

  sortableTableConfig: {

    filteringIgnoreCase: true,

    messageConfig: {
      searchLabel: '',
      searchPlaceholder: 'Search',
    },

    customIcons: {
      'sort-asc': 'fa fa-caret-up',
      'sort-desc': 'fa fa-caret-down',
      caret: 'fa fa-minus',
      'column-visible': 'fa fa-minus',
    },

    customClasses: {
      pageSizeSelectWrapper: 'pagination-number'
    }
  },

  columns: [
    {
      propertyName: 'fullname',
      title: 'Name',
      disableFiltering: true,
      filterWithSelect: false,
      template: 'protected/users/index/table/user-list/user-edit'
    },
    {
      propertyName: 'email',
      title: 'Email',
      disableFiltering: true,
      filterWithSelect: false
    },
    {
      propertyName: 'type',
      title: 'Type',
      disableFiltering: true,
      filterWithSelect: false
    },
    {
      propertyName: 'online',
      title: 'Connection status',
      disableFiltering: true,
      filterWithSelect: false,
      template: 'protected/users/index/table/user-list/is-online'
    },
    {
      title: 'Team',
      disableFiltering: true,
      filterWithSelect: false,
      template: 'protected/users/index/table/user-list/team-setting'
    },
  ],

  actions: {

    toggleUserSetting(user) {
      this.send('togglePopup', user);
    },

    closePopup(user) {
      user.set('teamOptionIsOpen', false);
    },

    openPopup(user) {
      user.set('teamOptionIsOpen', true);
    },

    togglePopup(user) {
      user.toggleProperty('teamOptionIsOpen');
    },

    changeUserTeam(user, team) {

      if (user.get('team.id') === team.id) {
        user.set('team', null);
      } else {
        user.set('team', team);
      }

      user.save()
        .then(() => {
          this.toast.success('This user\'s team setting has been updated.');
        })
        .catch(() => {
          this.toast.error('Looks like an error occured. Please retry in a few seconds.');
        });
    }
  }
});
