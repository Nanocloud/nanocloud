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

  session: Ember.inject.service('session'),

  loadState: {
    application: 0,
    user: 0,
    session: 0,
    machine: 0,
  },

  users: Ember.computed('model.users', 'model.users', function() {
    return this.get('model.users')
      .rejectBy('isAdmin', true);
  }),

  apps: Ember.computed('model.apps', 'model.apps', function() {
    return this.get('model.apps')
      .rejectBy('alias', 'Desktop');
  }),

  sessions: Ember.computed('model.sessions', 'model.sessions', function() {
    return this.get('model.sessions');
  }),

  machines: Ember.computed('model.machines', 'model.machines', function() {
    return this.get('model.machines').filterBy('status', 'running');
  }),

  activator: function() {
    this.loadData('app', 'apps');
    this.loadData('user', 'users');
    this.loadData('session', 'sessions');
    this.loadData('machine', 'machines');
  },

  loadData(data, dest) {
    this.set('loadState.' + data, 1);
    this.get('store').query(data, {})
      .then((response) => {
        this.set('loadState.' + data, 0);
        this.set('model.' + dest, response);
      })
      .catch(() => {
        this.set('loadState.' + data, 2);
      });
  },

  actions : {
    goToApps() {
      this.transitionToRoute('protected.apps');
    },
    goToUsers() {
      this.transitionToRoute('protected.users');
    },
    goToConnectedUsers() {
      this.transitionToRoute('protected.histories');
    },
    goToMachines() {
      this.transitionToRoute('protected.machines');
    },
  }
});
