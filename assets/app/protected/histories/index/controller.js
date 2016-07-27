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

  downloadCSVService: Ember.inject.service('download-csv'),
  sessionService: Ember.inject.service('session'),
  avgSessionDuration: 0,
  modelIsEmpty: Ember.computed.empty('items'),
  formatSessionLabel: Ember.computed('items', function() {
    if (this.get('items').get('length') > 1) {
      return "sessions";
    }
    return "session";
  }),
  sortableTableConfig: {

    filteringIgnoreCase: true,
    messageConfig: {
      searchLabel: "Search",
    },

    customIcons: {
      "sort-asc": "fa fa-caret-up",
      "sort-desc": "fa fa-caret-down",
      "caret": "fa fa-minus",
      "column-visible": "fa fa-minus",
    },

    customClasses: {
      "pageSizeSelectWrapper": "pagination-number"
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
    var sumSessionDuration = 0;
    this.get('items').forEach(function(item) {
      sumSessionDuration += item.get('duration') / 1000;
      ret.push(Ember.Object.create({
        user: item.get('userFullName'),
        application: item.get('connectionId'),
        machineDriver: item.get('machineDriver'),
        machineId: item.get('machineId'),
        machineSize: item.get('machineSize'),
        start: window.moment(item.get('startDate')).format('MMMM Do YYYY, h:mm:ss A'),
        end: window.moment(item.get('endDate')).format('MMMM Do YYYY, h:mm:ss A'),
        duration: item.get('duration') / 1000,
      }));
    });
    this.set('data', ret);
    if (sumSessionDuration > 0) {
      this.set('avgSessionDuration', sumSessionDuration / this.get('items').toArray().length);
    }
    return ret;
  },

  columns: [
    {
      "propertyName": "user",
      "title": "User",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "application",
      "title": "Application",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "machineDriver",
      "title": "Driver",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "machineId",
      "title": "Machine ID",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "machineSize",
      "title": "Machine Size",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "start",
      "title": "Start Date",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "end",
      "title": "End Date",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "duration",
      "title": "Total duration",
      "disableFiltering": true,
      "filterWithSelect": false,
      "template": "sortable-table/duration",
    }
  ],

  actions: {
    downloadCSV() {
      this.get('downloadCSVService').downloadCSV(this.get('sessionService.access_token'), this.get('items'));
    }
  }
});
