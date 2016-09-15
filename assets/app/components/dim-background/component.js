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
  classNames: ['dim-background'],
  classNameBindings: ['show:state-show:state-hide'],
  opacity: 0.6,
  duration: 200,

  animation: function() {
    if (this.get('show')) {
      Ember.$(this.get('element')).velocity('stop').velocity({ opacity: this.get('opacity')}, {
        easing: 'easeOutQuart',
        duration: this.get('duration')
      });
    }
    else {
      Ember.$(this.get('element')).velocity('stop').velocity({ opacity: 0}, {
        easing: 'easeOutQuart',
        duration: this.get('duration'),
      });
    }
  }.observes('show'),

  click: function() {
    if (!this.get('preventAction')) {
      this.sendAction();
    }
  },
});
