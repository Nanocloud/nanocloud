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

  mode: null,
  placeholder: '',
  value: '',
  focus: false,
  type: 'text',
  validation: null,
  isFocused: false,

  didInsertElement() {
    if (this.get('autofocus') === true) {
      this.$().find('input').focus();
    }
  },

  init: function() {
    this._super(...arguments);
    var valuePath = this.get('valuePath');

    if (this.get('model')) {
      Ember.defineProperty(this, 'value', Ember.computed.alias(`model.${valuePath}`));
      Ember.defineProperty(this, 'validation', Ember.computed.oneWay(`model.validations.attrs.${valuePath}`));
    }
  },

  notValidating: Ember.computed.not('validation.isValidating'),
  hasContent: Ember.computed.notEmpty('value'),
  isValid: Ember.computed.and('hasContent', 'validation.isValid', 'notValidating'),
  isInvalid: Ember.computed('validation.isInvalid', 'hideError', function() {
    if (!this.get('hideError') && !this.get('hasContent')) {
      return false;
    }
    return this.get('validation.isInvalid');
  }),
  showMessage: Ember.computed.oneWay('isInvalid'),

  actions: {
    focusIn: function() {
      this.set('isFocused', true);
    },
    focusOut: function() {
      this.set('isFocused', false);
    },
    toggleFocus: function() {
      this.toggleProperty('focus');
    }
  }
});
