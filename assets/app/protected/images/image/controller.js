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
  configuration: Ember.inject.service('configuration'),

  isInstancesSizeSupported: Ember.computed('configuration.iaas', function() {
    return this.get('configuration.iaas') !== 'manual';
  }),
  publicationDate: Ember.computed(function() {
    return window.moment(new Date(this.get('model.publicationDate'))).format('MMMM Do YYYY, h:mm:ss A');
  }),

  preventDeletion: Ember.computed('imageNameConfirm', 'model.name', function() {
    return this.get('imageNameConfirm') !== this.get('model.name');
  }),

  isRemoveable: Ember.computed('model.id', function() {
    return this.get('model.buildFrom') !== null;
  }),

  poolSize: Ember.computed('model.poolSize', 'configuration.machinePoolSize', function() {
    return this.get('model.poolSize') || this.get('configuration.machinePoolSize');
  }),

  actions: {

    toggleModal() {
      this.set('imageNameConfirm', '');
      this.toggleProperty('showModal');
    },

    deleteImage() {
      let _this2 = this;
      if (!this.get('preventDeletion')) {
        let image = this.get('model');
        image.destroyRecord()
          .then(() => {
            _this2.send('toggleModal');
            _this2.transitionToRoute('protected.images');
            _this2.toast.success('The image has been deleted');
          })
          .catch((reason) => {
            _this2.toast.error(reason.errors[0].title);
          });
      }
    },

    changeImageSize(size) {
      let image = this.get('model');

      image.set('instancesSize', size);
      image.save();
    },

    saveImageName: function(defer) {
      this.get('model').validate({ on: ['name'] })
        .then(({ validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(this.get('model.validations.attrs.name.messages'));
            return defer.reject(this.get('model.validations.attrs.name.messages'));
          }

          this.model.save()
            .then(() => {
              this.send('refreshModel');
              defer.resolve();
              this.toast.success('Image name has been updated successfully!');
            })
            .catch(() => {
              defer.reject();
              this.toast.error('Image name has not been updated');
              this.get('model').rollbackAttributes();
            });
        });
    },

    changeImagePoolSize: function(defer) {
      this.get('model')
        .validate({ on: ['poolSize'] })
        .then(({ validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(this.get('model.validations.attrs.poolSize.messages'));
            return defer.reject(this.get('model.validations.attrs.poolSize.messages'));
          }

          this.model.save()
            .then(() => {
              defer.resolve();
              this.send('refreshModel');
              this.toast.success('Image\'s pool size has been updated successfully');
            }, () => {
              defer.reject();
              this.toast.error('Image\'s pool size has not been updated');
            });
        });
    },
  }
});
