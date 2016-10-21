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

  data : Ember.computed('model', 'items', function() {
    return this.setData();
  }),

  setData: function() {
    if (!this.get('items')) {
      return;
    }
    var ret = Ember.A([]);
    this.get('items').forEach(function(item) {
      var timeNow = window.moment(new Date(),'DD/MM/YYYY HH:mm:ss');
      var timeCreatedAt = window.moment(item.get('createdAt'),'DD/MM/YYYY HH:mm:ss');
      ret.push(Ember.Object.create({
        user: item.get('userId'),
        machineDriver: item.get('machineDriver'),
        machineId: item.get('machineId'),
        machineSize: item.get('machineFlavor'),
        state: item.get('state'),
        poolSize: item.get('poolSize'),
        createdAt: window.moment(item.get('createdAt')).format('MMMM Do YYYY, h:mm:ss A'),
        secondsSinceCreatedAt: Math.floor(window.moment.duration(timeCreatedAt.diff(timeNow), 'milliseconds').asSeconds()),
      }));
    });
    this.set('data', ret);
    return ret;
  },

  columns: [
    {
      propertyName: 'user',
      title: 'User',
      disableFiltering: true,
      filterWithSelect: false,
    },
    {
      propertyName: 'state',
      title: 'State',
      disableFiltering: true,
      filterWithSelect: false,
    },
    {
      propertyName: 'machineDriver',
      title: 'Driver',
      disableFiltering: true,
      filterWithSelect: false,
    },
    {
      propertyName: 'machineId',
      title: 'Machine ID',
      disableFiltering: true,
      filterWithSelect: false,
    },
    {
      propertyName: 'machineSize',
      title: 'Machine Size',
      disableFiltering: true,
      filterWithSelect: false,
    },
    {
      propertyName: 'poolSize',
      title: 'Pool Size',
      disableFiltering: true,
      filterWithSelect: false,
    },
    {
      propertyName: 'createdAt',
      title: 'Created At',
      disableFiltering: true,
      filterWithSelect: false,
      sortedBy: 'secondsSinceCreatedAt',
      sortPrecedence: true,
      sortDirection: 'desc',
    },
  ]
});
