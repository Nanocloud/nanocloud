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


  publicationDate: Ember.computed(function() {
    return window.moment(new Date(this.get('model.publicationDate'))).format('MMMM Do YYYY, h:mm:ss A');
  }),

  preventDeletion: Ember.computed('appNameConfirm', 'model.displayName', function() {
    return this.get('appNameConfirm') !== this.get('model.displayName');
  }),

  actions: {

    toggleModal() {
      this.set('appNameConfirm', '');
      this.toggleProperty('showModal');
    },

    deleteApp() {
      if (!this.get('preventDeletion')) {
        let app = this.get('model');
        app.destroyRecord()
        .then(() => {
          this.send('toggleModal');
          this.transitionToRoute('protected.apps');
          this.toast.success('The application has been deleted');
        })
        .catch(() => {
          this.toast.error('The application can\'t be deleted');
        });
      }
    },

    saveAppName: function(defer) {
      this.get('model').validate({ on: ['displayName'] })
        .then(({ validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(this.get('model.validations.attrs.displayName.messages'));
            return defer.reject(this.get('model.validations.attrs.displayName.messages'));
          }

          this.model.save()
            .then(() => {
              this.send('refreshModel');
              defer.resolve();
              this.toast.success('Application name has been updated successfully!');
            })
            .catch(() => {
              defer.reject();
              this.toast.error('Application name has not been updated');
              this.get('model').rollbackAttributes();
            });
        });
    },
  }
});
