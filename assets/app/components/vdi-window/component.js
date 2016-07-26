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

export default Ember.Component.extend({

  remoteSession: Ember.inject.service('remote-session'),

  inputFocusChanged: function() {

    var inputs = ['textarea', 'input'];

    for (let i = 0; i < inputs.length; i++) {
      if (this.$().find(inputs[i]).length !== 0) {
        this.$().find(inputs[i])
          .focusin(function() {
            this.get('remoteSession').pauseInputs(this.get('connectionName'));
          }.bind(this))
          .focusout(function() {
            this.get('remoteSession').restoreInputs(this.get('connectionName'));
          }.bind(this));
      }
    }
  }.on('didInsertElement'),


  actions: {
    toggleVdiWindow() {
      if (this.get('toggleWindow')) {
        this.toggleWindow();
      }
      else {
        this.toggleProperty('stateVisible');
      }
    },
  }
});
