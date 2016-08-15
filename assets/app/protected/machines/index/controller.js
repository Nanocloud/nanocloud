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
      searchLabel: 'Search',
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
        status: item.get('status'),
        id: item.get('id'),
        ip: item.get('ip'),
        platform: item.get('platform'),
        machineSize: item.get('machineSize'),
        displayCountdown: item.get('displayCountdown'),
        shouldEnableLightBulb: item.get('shouldEnableLightBulb'),
        countdownTimeleft: item.get('countdownTimeleft'),
        formattedTimeleft: item.get('formattedTimeleft'),
      }));
    });
    this.set('data', ret);
    return ret;
  },

  columns: [
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
      propertyName: 'status',
      title: 'Status',
      disableFiltering: true,
      filterWithSelect: false,
      template: 'protected/machines/index/table/machine-list/status',
    },
    {
      propertyName: 'platform',
      title: 'Platform',
      disableFiltering: true,
      filterWithSelect: false,
    },
    {
      propertyName: 'machineSize',
      title: 'Size',
      disableFiltering: true,
      filterWithSelect: false,
    },
    {
      propertyName: 'platform',
      title: 'Boot state',
      disableFiltering: true,
      filterWithSelect: false,
      template: 'protected/machines/index/table/machine-list/boot',
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

  machinesController: Ember.inject.controller('protected.machines'),
  drivers: Ember.computed.alias('machinesController.drivers'),

  machines: Ember.computed('model.@each.isNew', 'model.@each.isDeleted', function() {
    return this.get('model').filterBy('isNew', false).filterBy('isDeleted', false);
  }),

  driverName : Ember.computed(function() {
    let machineDriver =  this.get('drivers');
    return machineDriver ? machineDriver.objectAt(0).id : null;
  }),

  isConfigurable : function() {
    return(this.get('driverName') !== 'qemu' &&
           this.get('driverName') !== 'manual' &&
           this.get('driverName') !== 'vmwarefusion');
  }.property('driverName'),

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
