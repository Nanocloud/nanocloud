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

  machinesController: Ember.inject.controller('protected.machines'),
  drivers: Ember.computed.alias('machinesController.drivers'),
  selectedItem: null,

  reset: function() {
    this.setProperties({
      machineName: '',
    });
  },

  actions: {

    selectItem(item) {
      this.set('selectedItem', item);
    },

    createMachine() {
      let type;
      let driver = this.get('drivers').objectAt(0);
      driver.get('types').forEach((item) => {
        if (this.get('selectedItem') === item.id) {
          type = item;
        }
      });
      if (!this.machineName) {
        this.toast.error('Insert a machine name');
        return;
      }
      if (!type) {
        this.toast.error('Select an instance type');
        return;
      }

      let m = this.store.createRecord('machine', {
        name: this.get('machineName'),
        type: type,
        driver: driver
      });

      m.save()
      .then((machine) => {
        this.transitionToRoute('protected.machines.machine', machine);
      });
    }
  }
});
