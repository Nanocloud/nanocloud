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

import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  name: DS.attr('string'),
  ip: DS.attr('string'),
  adminPassword: DS.attr('string'),
  progress: DS.attr('number'),
  type: DS.attr('string'),
  isUp: Ember.computed('status', function() {
    return this.get('status') === 'up';
  }),
  endDate: DS.attr('date'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  expiration: Ember.computed('endDate', function() {
    let now = new Date();
    let time = window.moment(this.get('endDate'));
    let res = Math.floor(window.moment.duration(window.moment(time,'DD/MM/YYYY HH:mm:ss').diff(window.moment(now,'DD/MM/YYYY HH:mm:ss')), 'milliseconds').asSeconds());

    if (res < 0) {
      res = 0;
    }
    return res;
  }),

  isDown: Ember.computed('status', function() {
    return this.get('status') === 'down';
  }),
  isDownloading: Ember.computed('status', function() {
    return this.get('status') === 'creating';
  }),
  machineName: Ember.computed('name', function() {
    return this.get('name') || 'No name';
  }),
  user: DS.belongsTo('user'),
});
