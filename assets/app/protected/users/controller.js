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
  configuration: Ember.inject.service('configuration'),
  setup() {
    this.get('configuration').loadData();
  },
  applicationController: Ember.inject.controller('application'),
  routeName: Ember.computed.oneWay('applicationController.currentRouteName'),

  groupTab: Ember.computed('applicationController.currentRouteName', function() {
    return (this.get('routeName').indexOf('protected.users.groups') === 0);
  }),

  teamTab: Ember.computed('applicationController.currentRouteName', function() {
    return (this.get('routeName').indexOf('protected.users.teams') === 0);
  }),

  userTab: Ember.computed('groupTab', 'teamTab', function() {
    return (
      this.get('groupTab') === false &&
      this.get('teamTab') === false
    );
  }),
});
