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
import config from 'nanocloud/config/environment';
import applyTheme from 'nanocloud/mixins/apply-theme';

export default Ember.Controller.extend(
  applyTheme, {
  identification: '',
  password: '',
  configuration: Ember.inject.service('configuration'),
  teamModal: false,
  name: config.APP.name,
  version: config.APP.version,

  reset() {
    this.setProperties({
      identification: '',
      password: '',
      autoRegister: config.APP.autoRegister
    });
  },

  actions: {
    authenticate() {
      let { identification, password } = this.getProperties('identification', 'password');
      if (this.get('session').get('isAuthenticated') === true) {
        this.get('session').invalidate();
      }

      this.get('session')
      .authenticate(
        'authenticator:oauth2',
        identification,
        password
      ).catch((err) => {
        if (err.error_description === 'This account is expired') {
          this.toast.error('This account is expired');
        } else {
          this.toast.error('Invalid credentials');
        }
      });
    }
  }
});
