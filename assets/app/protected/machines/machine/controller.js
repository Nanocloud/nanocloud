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
  loadState: false,
  user: Ember.computed('model.users', function() {
    var user = this.get('model.users');
    return user ? user.objectAt(0) : null;
  }),

  machineName: Ember.computed('model.name', function() {
    return this.get('model.name') ? this.get('model.name') : 'Machine';
  }),

  startMachine() {
    let machine = this.get('model');

    machine.set('status', 'up');
    machine.save();
  },

  stopMachine() {
    let machine = this.get('model');

    machine.set('status', 'down');
    machine.save();
  },

  terminateMachine() {
    let machine = this.get('model');

    machine.destroyRecord();
    this.transitionToRoute('protected.machines');
  },

  actions: {
    startMachine() {
      this.startMachine();
    },

    stopMachine() {
      this.stopMachine();
    },

    terminateMachine() {
      this.terminateMachine();
    }
  }
});

