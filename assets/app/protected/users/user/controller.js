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

  store: Ember.inject.service('store'),
  session: Ember.inject.service('session'),
  passwordConfirmation: null,
  isMe: Ember.computed('session.user', 'model', function() {
    return this.get('model.id') === this.get('session.user.id');
  }),

  actions: {

    removeDone: function() {
      this.get('model').destroyRecord()
        .then(() => {
          this.toast.success("User have been deleted");
          this.transitionToRoute('protected.users.index');
        }, (err) => {
          this.toast.error(err, "User have not been deleted");
        });
    },

    toggleEditPassword: function() {
      this.set('model.password', "");
      this.set('passwordConfirmation', "");
    },

    updatePrivilege: function(defer) {
      let model = this.get('model');
      let is_admin = model.toggleProperty('isAdmin');
      model.validate({ on: ['isadmin'] })
        .then(({ m, validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(this.get('model.validations.attrs.isadmin.messages'));
            return defer.reject(this.get('model.validations.attrs.isadmin.messages'));
          }

          this.model.save()
            .then(() => {
              this.send('refreshModel');
              if (is_admin === true) {
                this.toast.success('Administration rights have been granted');
              }
              else {
                this.toast.success('Administration rights have been revoked');
              }
            }, () => {
              this.toast.error("Administration rights have not been granted");
            });
        });
    },

    changeEmail: function(defer) {
      this.get('model')
        .validate({ on: ['email'] })
        .then(({ m, validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(this.get('model.validations.attrs.email.messages'));
            return defer.reject(this.get('model.validations.attrs.email.messages'));
          }

          this.model.save()
            .then(() => {
              defer.resolve();
              this.send('refreshModel');
              this.toast.success('Email has been updated successfully');
            }, () => {
              defer.reject();
              this.toast.error("Email has not been updated");
            });
        });
    },

    changeFirstName: function(defer) {

      this.get('model')
        .validate({ on: ['firstName'] })
        .then(({ m, validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(this.get('model.validations.attrs.firstname.messages'));
            return defer.reject(this.get('model.validations.attrs.firstname.messages'));
          }

          this.model.save()
            .then(() => {
              defer.resolve();
              this.send('refreshModel');
              this.toast.success('First name has been updated successfully');
            }, () => {
              defer.reject();
              this.toast.error("First name has not been updated");
            });
        });
    },

    changeLastName: function(defer) {

      this.get('model')
        .validate({ on: ['lastName'] })
        .then(({ m, validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(this.get('model.validations.attrs.lastname.messages'));
            return defer.reject(this.get('model.validations.attrs.lastname.messages'));
		  }

          this.model.save()
            .then(() => {
              defer.resolve();
              this.send('refreshModel');
              this.toast.success('Last name has been updated successfully');
            }, () => {
              defer.reject();
              this.toast.error("Last name has not been updated");
            });
        });
    },

    changeExpirationDays: function(defer) {

      this.get('model')
        .validate({ on: ['expirationDate'] })
        .then(({ m, validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(this.get('model.validations.attrs.expirationDate.messages'));
            return defer.reject(this.get('model.validations.attrs.expirationDate.messages'));
          }
          this.model.save()
            .then(() => {
              defer.resolve();
              this.send('refreshModel');
              this.toast.success('Expiration date has been updated successfully');
            }, () => {
              defer.reject();
              this.toast.error("Expiration date has not been updated");
            });
		});
	},

    changePassword: function(defer) {

      this.get('model')
        .validate({ on: ['password'] })
        .then(({ m, validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(this.get('model.validations.attrs.password.messages'));
            return defer.reject(this.get('model.validations.attrs.password.messages'));
          }

          if (this.get('model.password') !== this.get('passwordConfirmation')) {
            this.toast.error("Password doesn't match confirmation");
            return defer.reject("Password does not match confirmation");
          }

          this.model.save()
            .then(() => {
              defer.resolve();
              this.send('toggleEditPassword');
              this.toast.success('Password has been updated successfully');
            }, () => {
              defer.reject();
              this.toast.error("Password has not been updated");
            });
        });
    }
  }
});
