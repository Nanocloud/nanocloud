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

export default Ember.Mixin.create({
  windowCollector: null,
  enabledWindow: Ember.computed('windowCollector', function() {
    let windowCollector = this.get('windowCollector');
    for (var i in windowCollector) {
      if (windowCollector[i] === true) {
        return i;
      }
    }
    return false;
  }),

  setup() {
    this.set('windowCollector', {
      upload: false,
      download: false,
      clipboard: false,
      onboardApp: false,
    });
  },

  init() {
    this._super(...arguments);
    this.setup();
  },

  toggleWindow(item) {
    let val = this.get('windowCollector.' + item);
    this.closeAllWindow();
    if (val === false) {
      this.toggleProperty('windowCollector.' + item);
    }
  },

  closeAllWindow() {
    this.setup();
  },

  closeAppPublisher() {
    this.set('windowCollector.onboardApp', false);
  },
  openAppPublisher() {
    this.set('windowCollector.onboardApp', true);
  },
  toggleShowAppPublisher() {
    this.toggleProperty('windowCollector.onboardApp');
  },

  actions: {
    toggleWindow(item) {
      this.toggleWindow(item);
    },
    closeAllWindow() {
      this.closeAllWindow();
      this.closeAppPublisher();
    },
  }
});
