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
  user: Ember.computed('model.users', () => {
    var user = this.get('model.users');
    return user ? user.objectAt(0) : null;
  }),

  displayCountdown: Ember.computed('model.countdownTimeleft', function() {
    return this.get('model.countdownTimeleft') > 0 ? true : false;
  }),

  controlsSupported: ['qemu','manual'],
  controlsAreSupported: Ember.computed('model.getPlatform', 'controlsSupported', function() {
    var ret = this.get('controlsSupported').indexOf(this.get('model.platform'));
    return ret === -1 ? false : true;
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

  rebootMachine() {
    let machine = this.get('model');
    this.set('loadState', true);
    machine.set('status', 'reboot');
    machine.save()
      .then(() => {
        this.toast.success('Machine has been rebooted');
      })
      .catch(() => {
        this.toast.error('Machine could not be rebooted');
      })
      .finally(() => {
        this.set('loadState', false);
      });
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

    rebootMachine() {
      this.rebootMachine();
    },

    terminateMachine() {
      this.terminateMachine();
    }
  }
});

