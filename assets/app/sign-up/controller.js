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
  loadState: 0,

  actions: {
    submitForm() {
      this.set('loadState', 1);
      this.get('model')
        .save()
        .then(() => {
          this.set('loadState', 2);
          this.toast.success('Please check out your mails to activate your account', 'Account created');
          Ember.run.later((() => {
            this.transitionToRoute('login');
          }), 0);
        })
        .catch((err) => {
          this.set('loadState', 0);
          this.toast.error(err.errors[0].detail, 'Account not created');
          return err.responseJSON;
        });
    }
  }
});
