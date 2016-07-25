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
  configuration: Ember.inject.service('configuration'),
  isEditing: false,
  loadState: false,
  loadInputs() {
    this.get('configuration.deferred')
      .then(() => {
        var params = this.get('configuration.keyToBeRetrieved');
        for (var property in params) {
          if (params.hasOwnProperty(property)) {
            this.set(params[property], this.get('configuration.' + params[property]));
            Ember.defineProperty(this, params[property], Ember.computed.alias('configuration.' + params[property]));
            this.addObserver(params[property], this.saveKey);
          }
        }
        this.set('loadState', true);
      });
  },

  unselectGroupWhenAutoRegisterIsOff: function() {
    if (this.get('loadState') === true) {
      if (this.get('autoRegister') === false) {
        this.set('defaultGroup', null);
        this.saveKey(null, 'defaultGroup');
      }
    }
  }.observes('autoRegister'),

  saveKey(sender, key) {
    this.get('configuration').saveData(key, this.get(key))
    .then(() => {
        this.toast.success('Configuration has been saved.');
      })
    .catch(() => {
      this.toast.error('Configuration could not be saved.');
    });
  },

  init() {
    this._super(...arguments);
    this.loadInputs();
  },

  actions: {
    selectGroup(id) {
      if (this.get('defaultGroup') === id) {
        this.set('defaultGroup', null);
      }
      else {
        this.set('defaultGroup', id);
      }
      this.saveKey(null, 'defaultGroup');
    },
  }
});
