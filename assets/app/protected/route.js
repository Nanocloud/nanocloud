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
  configuration: Ember.inject.service(),
  setupController(controller) {
    this.get('configuration').loadData();
    controller.setup();
    controller.set('teamModel', this.store.createRecord('team', {}));
  },

  beforeModel(transition) {
    if (transition.queryParams.app) {
      this.set('directLinkParams', transition.queryParams);
    }
    if (this.get('session.isAuthenticated') === false) {
      this.transitionTo('login');
    }
    else {
      if (this.get('directLinkParams')) {
        this.transitionTo('direct-link', {
          queryParams: this.get('directLinkParams')
        });
      }
    }
  },

  afterModel(user) {
    this.set('session.user', user);
  },

  model() {
    this.set('session.access_token', this.get('session.data.authenticated.access_token'));
    return this.store.queryRecord('user', { me: true });
  }
});
