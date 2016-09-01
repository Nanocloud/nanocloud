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

export default Ember.Service.extend({
  store: Ember.inject.service('store'),
  session: Ember.inject.service('session'),
  keyToBeRetrieved: [
    'autoRegister',
    'autoLogoff',
    'sessionDuration',
    'smtpServerHost',
    'smtpServerPort',
    'expirationDate',
    'smtpLogin',
    'smtpPassword',
    'smtpSendFrom',
    'host',
    'defaultGroup',
    'title',
    'favIconPath',
    'logoPath',
    'primaryColor',
    'uploadLimit',
    'creditLimit',
    'iaas',
    'teamEnabled',
  ],
  keyToBeRetrievedAsString: Ember.computed('keyToBeRetrieved', function() {
    let params = this.get('keyToBeRetrieved');
    let data = '';
    for ( var property in params ) {
      if (params.hasOwnProperty(property)) {
        data += params[property];
        if (params[params.length-1] !== params[property]) {
          data += ',';
        }
      }
    }
    return data;
  }),

  loadData() {
    var promise = this.set('deferred', this.get('store').query('config', { key: this.get('keyToBeRetrievedAsString') }));
    promise.then((res) => {
      res.forEach((item) => {
        var val = item.get('value');
        if (val === 'true' || val === 'false') {
          val = (val === 'true');
        }
        this.set(item.get('id'), val);
      });
    });
    return promise;
  },

  getValue(key) {
    var res = this.get('deferred')
      .filterBy('key', key)
      .objectAt(0);
    if (res) {
      return res.get('value') || '';
    }
    return '';
  },

  saveData(key, value) {
    return this.get('store').createRecord('config', { key: key, value: value }).save();
  },
});
