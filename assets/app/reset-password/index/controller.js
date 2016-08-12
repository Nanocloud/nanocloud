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

  passwordConfirmation: null,
  loadState: 0,
  userHasSubmitted: false,

  actions: {
    submitForm() {
      this.set('loadState', 1);
      this.set('userHasSubmitted', true);
      this.model
        .validate({ on: ['email'] })
        .then(({ validations }) => {
          if (validations.get('isInvalid') === true) {
            return this.toast.error('Please enter valid informations');
          }

          this.model.save()
            .then(() => {
              this.set('loadState', 2);
              this.toast.success('Please check out your emails to reset your password',
                    'Link sent');
              this.transitionToRoute('login');
            },
              (err) => {
                this.set('loadState', 0);
                this.toast.error(err.errors[0].detail, 'Password can not be reset');
                return err.responseJSON;
              });
        });
    }
  }
});
