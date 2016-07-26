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
  tmpValue: Ember.computed.oneWay('value'),
  classNames: 'confirm-input',

  isModified: Ember.computed('value', 'tmpValue', function() {
    return this.get('value') !== this.get('tmpValue');
  }),

  keyDown(event) {
    if (event.key === 'Escape') {
      this.resetValue();
      event.stopPropagation();
      return false;
    }
    return true;
  },

  resetValue: function() {
    this.set('tmpValue', this.get('value'));
    this.$().find('input').focus();
  },

  actions: {
    focusIn: function() {
      this.set('focus', true);
    },
    focusOut: function() {
      this.set('focus', false);
    },
    saveValue: function() {
      this.set('value', this.get('tmpValue'));
    },
    resetValue: function() {
      this.resetValue();
    }
  }
});
