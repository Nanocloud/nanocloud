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

  userIsConnected: function() {
    if (!this.get('sessions')) {
      return ;
    }
    if (this.get('sessions').filterBy('userId', this.get('userId')).length === 0) {
      return false;
    }
    else {
      return true;
    }
  }.property('sessions'),

  userIsConnectedStatus: Ember.computed('userIsConnected', function() {
    return this.get('userIsConnected') ? 'up' : 'down';
  }),

  tooltipMessage: function() {
    if (this.get('userIsConnected') === true) {
      return "User is online";
    }
    return "User is offline";
  }.property('userIsConnected'),
});
