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
