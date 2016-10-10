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

let App = Ember.Object.extend({
  remoteSession: Ember.inject.service('remote-session'),
  model: null,

  id: Ember.computed('model.id', function() {
    return this.get('model.id');
  }),

  name: Ember.computed('model.displayName', function() {
    return this.get('model.displayName');
  }),

  launch() {
    this.set('remoteSession.plazaHasFinishedLoading', false);
    this.get('controller')
      .launchVDI(this.get('id'))
      .catch((err) => {
        if (err === 'Exceeded credit') {
          this.toast.error('Exceeded credit');
        } else {
          this.send('error', err);
        }
      });
  }
});

export default Ember.Controller.extend({
  showSingleTab: false,
  showFileExplorer: false,
  connectionName: null,
  session: Ember.inject.service('session'),
  remoteSession: Ember.inject.service('remote-session'),
  configuration: Ember.inject.service('configuration'),
  isPublishing: false,
  isCheckingMachine: false,

  modelIsEmpty: Ember.computed.empty('items'),

  hasDesktop: Ember.computed('items', function() {
    var res = this.get('items').filterBy('alias', 'Desktop').get('length');
    return res > 0 ? true : false;
  }),

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

  data : Ember.computed('items.@each', 'items', function() {

    const ret = Ember.A();
    const remoteSession = this.get('remoteSession');

    this.get('items').forEach((app) => {
      if (app.get('alias') !== 'Desktop') {
        ret.push(App.create({
          model: app,
          remoteSession: remoteSession,
          session: this.get('session'),
          controller: this
        }));
      }
    });
    return ret;
  }),

  columns: function() {

    return [
      {
        propertyName: 'name',
        title: 'Name',
        disableFiltering: true,
        filterWithSelect: false,
        disableSorting: true,
        template: 'protected/apps/index/table/package-list/name'
      },
    ];
  }.property(),

  launchVDI(appId) {

    return new Ember.RSVP.Promise((res, rej) => {

      this.set('isCheckingMachine', true);
      this.get('store').query('machines/user', {})
        .then((machines) => {
          if (machines.get('length') > 0) {
            this.get('remoteSession').one('connected', () => {
              res();
            });
            this.set('connectionName', appId);
            this.transitionToRoute('vdi', {
              queryParams: {
                connection_name: this.get('connectionName'),
                machine_id: machines.objectAt(0).get('id')
              }
            });
          }
          else {
            this.toast.error('Could not find a virtual machine to start the VDI');
            rej();
          }
        })
        .catch((err) => {
          if (err.errors && err.errors[0].status === '402') {
            this.toast.error('Credit exceeded');
          } else {
            this.send('error', err);
          }
        })
        .finally(() => {
          this.set('isCheckingMachine', false);
        });
    });
  },

  actions: {

    retryConnection() {
      this.toggleProperty('activator');
    },

    startDesktop() {
      var list = this.get('items').filterBy('alias', 'Desktop');
      if (list.length === 1) {
        var app = list.objectAt(0);

        var desktop = App.create({
          model: app,
          remoteSession: this.get('remoteSession'),
          controller: this
        });
        desktop.launch();
      }
    },

    toggleFileExplorer() {
      this.toggleProperty('showFileExplorer');
    },

    closeFileExplorer() {
      this.set('showFileExplorer', false);
    },

    openFileExplorer() {
      this.set('showFileExplorer', true);
    },

    onboardAppSucceeded() {
      this.send('closeFileExplorer');
      this.send('refreshModel');
    }
  }
});
