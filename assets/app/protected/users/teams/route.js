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

export default Ember.Route.extend({
  setupController(controller, model) {
    controller.set('teams', model);
  },

  configuration: Ember.inject.service('configuration'),
  beforeModel() {
    this.get('configuration').loadData()
      .then(() => {
        if (!this.get('configuration.teamEnabled')) {
          this.transitionTo('protected.dashboard');
          this.toast.error('Team is not available. Please contact your administrator');
        }
      });
  },

  model() {
    if (this.get('session.user.isAdmin')) {
      return this.store.query('team', {});
    } else if (this.get('session.user.team.id') && this.get('session.user.isTeamAdmin') === true) {
      return this.store.findRecord('team', this.get('session.user.team.id'))
        .then((team) => {
          return [team];
        });
    } else {
      return [];
    }
  },

  actions: {
    refreshTeamsData() {
      this.refresh();
    },
  }
});
