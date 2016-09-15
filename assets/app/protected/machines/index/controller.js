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
  store: Ember.inject.service('store'),
  modelIsEmpty: Ember.computed.empty('items'),
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

  setData: function() {
    var ret = Ember.A([]);
    this.get('items').forEach(function(item) {
      ret.push(Ember.Object.create({
        name: item.get('machineName'),
        id: item.get('id'),
        ip: item.get('ip'),
        expiration: item.get('expiration'),
        status: item.get('status'),
        user: item.get('user'),
        endDate: item.get('endDate'),
      }));
    });
    this.set('data', ret);
    return ret;
  },

  columns: [
    {
      propertyName: 'id',
      title: 'ID',
      disableFiltering: true,
    },
    {
      propertyName: 'boot',
      title: 'Status',
      disableFiltering: true,
      filterWithSelect: false,
      template: 'protected/machines/index/table/machine-list/boot',
    },
    {
      propertyName: 'name',
      title: 'Name',
      disableFiltering: true,
      filterWithSelect: false,
      template: 'protected/machines/index/table/machine-list/name',
    },
    {
      propertyName: 'ip',
      title: 'IP',
      disableFiltering: true,
      filterWithSelect: false,
    },
    {
      title: 'Assigned to',
      disableFiltering: true,
      filterWithSelect: false,
      template: 'protected/machines/index/table/machine-list/assigned-to',
    },
    {
      title: 'Expires in',
      disableFiltering: true,
      filterWithSelect: false,
      template: 'protected/machines/index/table/machine-list/expiration',
    },
  ],

  lookIfRefreshIsNeeded: function() {
    var res = this.get('model').filterBy('countdownTimeleft', 0).get('length');

    if (res > 0) {
      this.set('needRefresh', true);
    }
    else {
      this.set('needRefresh', false);
    }
  }.observes('model.@each.countdownTimeleft'),

  machines: Ember.computed('model.@each.isNew', 'model.@each.isDeleted', function() {
    return this.get('model').filterBy('isNew', false).filterBy('isDeleted', false);
  }),

  actions: {
    selectMachine(machine) {
      this.transitionToRoute('protected.machines.machine', machine);
    },

    downloadWindows: function() {
      let machine = this.store.createRecord('machine', {
        name: 'windows-custom-server-127.0.0.1-windows-server-std-2012R2-amd64',
        adminPassword: 'Nanocloud123+',
      });

      machine.save()
      .then(() => {
        this.toast.info('Windows is downloading');
      })
      .catch(() => {
        this.toast.error('Could not download Windows, please try again');
      });
    }
  }
});
