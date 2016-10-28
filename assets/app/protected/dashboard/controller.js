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
import formatSize from 'nanocloud/utils/format-size';

export default Ember.Controller.extend({

  session: Ember.inject.service('session'),

  loadState: {
    application: 0,
    user: 0,
    session: 0,
    machine: 0,
  },

  users: Ember.computed('model.users', function() {
    return this.get('model.users')
      .rejectBy('isAdmin', true);
  }),

  apps: Ember.computed('model.apps', function() {
    return this.get('model.apps')
      .rejectBy('alias', 'Desktop');
  }),

  sessions: Ember.computed('model.sessions', function() {
    return this.get('model.sessions');
  }),

  machines: Ember.computed('model.machines', function() {
    return this.get('model.machines').filterBy('status', 'running');
  }),

  images: Ember.computed('model.images', function() {
    return this.get('model.images');
  }),

  files: Ember.computed('model.files', function() {
    return this.get('model.files');
  }),

  cumulatedSizeUploaded: Ember.computed('loadState.file', function() {
    let sum = 0;
    if (this.get('loadState.file') === 0) {
      let files = this.get('files');
      files.forEach((item) => {
        sum += item.get('size');
      });
    }
    return sum;
  }),

  fileTitle: Ember.computed('cumulatedSizeUploaded', function() {
    return 'File uploaded ( total : ' + formatSize(this.get('cumulatedSizeUploaded')) + ' )';
  }),

  activator: function() {
    this.loadData('app', 'apps');
    this.loadData('user', 'users');
    this.loadData('session', 'sessions');
    this.loadData('machine', 'machines');
    this.loadData('image', 'images');
    this.loadData('file', 'files');
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
      this.transitionToRoute('protected.images');
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
    goToFiles() {
      this.transitionToRoute('protected.files');
    },
  }
});
