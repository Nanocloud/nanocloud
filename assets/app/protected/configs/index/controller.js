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
  configController: Ember.inject.controller('protected.configs'),

  images: Ember.computed('model.images', function() {
    return this.get('model.images');
  }),

  activator() {
    this.get('store').query('image', {})
      .then((response) => {
        this.set('model.images', response);
      });
  },

  actions: {
    saveImagePoolSize(image, e) {
      image.set('poolSize', e.target.value);
      image.validate({ on: ['poolSize'] })
        .then(({ validations }) => {

          if (validations.get('isInvalid') === true) {
            this.toast.error(image.get('validations.attrs.poolSize.messages'));
          } else {
            image.save()
              .then(() => {
                this.toast.success('Image\'s pool size has been updated successfully');
              }, () => {
                this.toast.error('Image\'s pool size has not been updated');
              });
          }
        });
    },
  }
});
