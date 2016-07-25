/**
 * Nanocloud, a comprehensive platform to turn any application into a cloud
 * solution.
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
import VdiWindowComponent from '../vdi-window/component';

export default VdiWindowComponent.extend({

  classNames: ['vdi-packaging'],
  store: Ember.inject.service('store'),

  actions: {
    savePackage() {
      var _package = this.get('store').createRecord('app', {
        displayName: this.get('packageName'),
        alias: this.get('packageName')
      });
      _package.save()
        .then(() => {
          console.log('suvbmit ok!');
          this.sendAction('hasFinished');
        });
    }  
  }
});
