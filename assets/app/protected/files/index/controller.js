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

  store: Ember.inject.service('store'),
  session: Ember.inject.service('session'),
  download: Ember.inject.service('download'),
  items: null,

  modelIsEmpty: Ember.computed.empty('items', 'items'),

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

  data : Ember.computed('items', 'items', function() {

    var ret = Ember.A([]);
    this.get('items').forEach(function(item) {
      if (item.get('type') !== 'directory') {
        ret.push(Ember.Object.create({
          type: item.get('icon'),
          name: item.get('name'),
          size: item.get('size'),
        }));
      }
    });
    return ret;
  }),

  columns: function() {

    return [
        {
          "propertyName": "type",
          "title": "Type",
          "disableFiltering": true,
          "filterWithSelect": false,
          "className": "short",
          "template": "sortable-table/file-type",
          "disableSorting": true,
        },
        {
          "propertyName": "name",
          "title": "Filename",
          "disableFiltering": true,
          "filterWithSelect": false,
        },
        {
          "propertyName": "size",
          "title": "Size",
          "disableFiltering": true,
          "filterWithSelect": false,
          "template": "sortable-table/size",
        },
        {
          "title": "Action",
          "className": "short",
          "template": "sortable-table/download-button",
          "disableSorting": true,
        }
    ];
  }.property(),

  actions : {

    uploadCallback(callback) {
      callback();
    },

    downloadFile: function(filename) {
      this.get('download').downloadFile(this.get('session.access_token'), filename);
    },
  }
});
