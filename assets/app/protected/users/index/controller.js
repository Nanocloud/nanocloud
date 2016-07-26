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

  setData: function() {
    if (!this.get('items')) {
      return;
    }
    var ret = Ember.A([]);
    this.get('items').forEach((item) => {

      if (!item.get('isNew')){
        ret.push(Ember.Object.create({
          id: item.get('id'),
          fullname: item.get('fullName'),
          email: item.get('email'),
          type: item.get('type'),
          online: null,
        }));
      }
    });
    this.set('data', ret);
    return ret;
  },

  columns: [
    {
      "propertyName": "fullname",
      "title": "Name",
      "disableFiltering": true,
      "filterWithSelect": false,
      "template": "sortable-table/user/user-edit",
    },
    {
      "propertyName": "email",
      "title": "Email",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "type",
      "title": "Type",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "online",
      "title": "Connection status",
      "disableFiltering": true,
      "filterWithSelect": false,
      "template": "sortable-table/user/is-online",
    },
  ],

});
