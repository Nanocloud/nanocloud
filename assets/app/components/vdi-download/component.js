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
import VdiWindowComponent from '../vdi-window/component';

export default VdiWindowComponent.extend({

  store: Ember.inject.service('store'),
  session: Ember.inject.service('session'),
  download: Ember.inject.service('download'),

  stateUpdated: function() {
    if (this.get('stateVisible') === true) {
      this.loadFiles();
    } 
  }.observes('stateVisible'),

  loadFiles: function() {

    this.get('store').query('file', { filename: "./" })
      .then(function(response) {
        this.set('items', response);
      }.bind(this))
      .catch((err) => {
        // If windows has to be ran once
        if (err.errors.length === 1 && err.errors[0].code === "000008") {
          return ;
        }

        this.toast.error("Couldn't retrieve files");
      });

  }.on('becameVisible'),

  actions: {
    downloadFile: function(filename) {
      this.get('download').downloadFile(this.get('session.access_token'), filename);
    },
  }
});
