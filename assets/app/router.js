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
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('protected', { path: '/' }, function() {
    this.route('users', function() {
      this.route('user', { path: '/:user_id' });
      this.route('new');
      this.route('users.new');
      this.route('groups', function() {
        this.route('group', { path: '/:group_id' }, function() {
          this.route('members');
          this.route('images');
        });
        this.route('new');
      });
      this.route('teams', function() {
        this.route('new');
      });
    });
    this.route('machines', function() {
      this.route('user');
      this.route('new');
      this.route('machine', { path: '/:machine_id' });
    });
    this.route('apps', function() {
      this.route('app', { path: '/:app_id' });
    });
    this.route('apps');
    this.route('images', function() {
      this.route('image', { path: '/:image_id' });
    });
    this.route('files', function() {
      this.route('nowindows');
    });
    this.route('histories', function() {});
    this.route('dashboard');
    this.route('configs', function() {
      this.route('user-right');
      this.route('email-configuration');
      this.route('other-setting');
      this.route('look-and-feel');
    });
    this.route('brokerlog', function() {});
  });

  this.route('login');
  this.route('direct-link');
  this.route('sign-up');

  this.route('activate', function() {
    this.route('activate',  { path: '/:activate_id' });
  });
  this.route('reset-password', function() {
    this.route('token',  { path: '/:reset-password_id' });
  });
});

export default Router;
