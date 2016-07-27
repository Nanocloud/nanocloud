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
import {validator, buildValidations} from 'ember-cp-validations';

const Validations = buildValidations({
  firstName: [
    validator('presence', true),
    validator('length', {
      min: 2,
      max: 255
    })
  ],
  lastName: [
    validator('presence', true),
    validator('length', {
      min: 2,
      max: 255
    })
  ],
  password: [
    validator('presence', true),
    validator('length', {
      min: 8,
      max: 255,
      type: 'password',
    })
  ],
  passwordConfirmation: [
    validator('presence', true),
    validator('confirmation', {
      on: 'password',
      message: 'Does not match password',
    }),
    validator('length', {
      min: 8,
      max: 255,
      type: 'password',
    })
  ],
  email: [
    validator('presence', true),
    validator('format', { type: 'email' })
  ],
  expirationDays: [
    validator('length', { max: 6 }),
    validator('number', {
      allowString: true,
	  allowBlank: true,
      positive: true,
      integer: true,
    })
  ]
});

export default DS.Model.extend(Validations, {
  email: DS.attr('string'),
  activated: DS.attr('boolean'),
  isAdmin: DS.attr('boolean'),
  firstName: DS.attr('string'),
  lastName: DS.attr('string'),
  password: DS.attr('string'),
  signupDate: DS.attr('number'),
  expirationDays: DS.attr('string'),

  fullName: function() {
    if (this.get('firstName') && this.get('lastName')) {
      return `${this.get('firstName')} ${this.get('lastName')}`;
    }
    let email = this.get('email');
    return email ? email : "Unknown user";
  }.property('firstName', 'lastName'),
  isNotAdmin: function() {
    return !this.get('isAdmin');
  }.property(),

  type: Ember.computed('isAdmin', 'isAdmin', function() {
    return this.get('isAdmin') ? 'Administrator' : 'Regular user';
  }),
  groups: DS.hasMany('group')
});
