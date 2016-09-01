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
  teamController: Ember.inject.controller('protected.users.teams'),
  team: Ember.computed.oneWay('teamController.team'),
  loadState: 0,
  session: Ember.inject.service('session'),
  actions: {
    submitForm() {
      let model = this.get('model');
      this.set('loadState', 1);
      model.set('team', this.get('session.user.team'));
      model.save()
        .then(() => {
          this.toast.success('Mail has been sent.', 'Account created');
          this.send('refreshModel');
          Ember.run.later((() => {
            this.transitionToRoute('protected.users.teams');
          }), 0);
        })
        .catch((err) => {
          this.toast.error(err.errors[0].detail, 'Account not created');
          return err.responseJSON;
        })
        .finally(() => {
          this.set('loadState', 0);
        });
    }
  }
});
