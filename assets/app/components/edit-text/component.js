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
import TooltipsterComponent from 'ember-cli-tooltipster/components/tool-tipster';

export default TooltipsterComponent.extend({

  originalValue: '',
  errorMessage: null,
  isEditing: false,

  updateEditStateWatcher: function() {
    this.set('editStateWatcher', this.get('isEditing'));
    if (this.get('isEditing') === true) {
      this.set('content', null);
    }
    else {
      this.set('content', this.get('tooltip'));
    }
  }.observes('isEditing'),

  getInputType: function() {
    return this.get('type') || 'text';
  }.property(),

  isValid: function() {
    return this.get('errorMessage');
  },

  autoSelectInput: function() {
    if (this.get('isEditing')) {
      Ember.run.scheduleOnce('afterRender', () => {
        this.$(this.get('element')).find('input').first().select();
      });
    }
  }.observes('isEditing'),

  setOriginalValue: function() {
    this.set('originalValue', this.get('textInput'));
  }.on('init'),

  click() {
    if (this.get('isEditing')) {
      return false;
    }
  },

  actions: {

    toggle() {
      if (this.get('isEditing')) {
        this.set('textInput', this.get('originalValue'));
        this.set('errorMessage', '');
      }

      this.toggleProperty('isEditing');
    },

    submit() {
      var defer = Ember.RSVP.defer();

      defer.promise.then(() => {
        this.set('originalValue', this.get('textInput'));
        this.send('toggle');
      }, (err) => {
        this.set('errorMessage', err);
      });

      this.sendAction('onClose', defer);
    },

    cancel() {
      this.send('toggle');
    },
  }
});
