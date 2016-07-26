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

export default Ember.Component.extend({

    application: null,
    isEditing: false,
    connectionName: null,
    showSingleTab: false,
    session: Ember.inject.service('session'),
    unpublishState: false,
    isUnpublished: false,

    actions : {

      toggleSingleTab(connectionName) {
        if (this.get('isEditing') === false) {
          this.set('connectionName', connectionName);
          this.toggleProperty('showSingleTab');
        }
      },

      toggleEditName() {
        this.toggleProperty('isEditing');
      },

      submitEditName(defer) {
        this.get('application').validate()
          .then(({
            model, validations
          }) => {
            if (validations.get('isInvalid')) {
              this.toast.error('Cannot change application name');
              return defer.reject(this.get('application.validations.attrs.displayName.messages'));
            }

            this.application.save()
              .then(() => {
                this.toggleProperty('isEditing');
                this.toast.success("Application has been renamed successfully");
                defer.resolve();
              })
              .catch(() => {
                this.toast.error("Application hasn't been renamed");
                defer.reject();
              });
          })
          .catch(() => {
            this.toast.error("Unknown error while rename application");
            defer.reject();
          });
      },

      cancelEditMode() {
        this.set('isEditing', false);
      },

      unpublish() {
        this.set('unpublishState', true);
        this.application.destroyRecord()
          .then(() => {
            this.toast.success("Application has been unpublished successfully");
            this.set('unpublishState', false);
            this.set('isUnpublished', true);
          }, () => {
            this.toast.error("Application hasn't been unpublished");
            this.set('unpublishState', false);
          });
      }
    }
});
