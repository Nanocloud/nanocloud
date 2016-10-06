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
import windowManagerMixin from 'nanocloud/mixins/window-manager';
import imageMixin from 'nanocloud/mixins/image';
import vdiLoadingMixin from 'nanocloud/mixins/vdi-loading';
import clipboardMixin from 'nanocloud/mixins/clipboard';
import downloadFileMixin from 'nanocloud/mixins/dl-file';

export default Ember.Controller.extend(
  imageMixin,
  vdiLoadingMixin,
  downloadFileMixin,
  clipboardMixin,
  windowManagerMixin, {

    remoteSession: Ember.inject.service('remote-session'),
    queryParams: ['machine_id', 'connection_name'],
    session: Ember.inject.service('session'),
    showHomeBtn: Ember.computed.not('configuration.autoLogoff'),
    dimBackground: Ember.computed.or('enabledWindow', 'windowCollector.onboardApp'),
    connectionName: Ember.computed.alias('connection_name'),

    // state
    logoff: false,

    vdiDisconnectHandler(options) {
      this.set('logoff', true);
      Ember.$.ajax({
        type: 'DELETE',
        headers: { Authorization : 'Bearer ' + this.get('session.access_token')},
        url: '/api/sessions',
        data: { user: './' + this.get('session.user')}
      })
      .then(() => {
        this.set('logoff', false);
        if (!options) {
          this.toast.success('You have been disconnected successfully');
        }
        else {
          if (options.error === true) {
            this.toast.error(options.message);
          }
          else {
            this.toast.success(options.message);
          }
        }
        this.send('goToApp');
      });
    },

    askDisconnect() {
      this.send('closeAll');
      window.swal({
        title: 'You are about to be disconnected',
        text: 'Do you want to end this session now?',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, I do.',
        cancelButtonText: 'No',
        closeOnConfirm: true,
        animation: false
      }, () => {
        this.vdiDisconnectHandler();
      });
    },

    actions: {
      goToApp() {
        this.get('remoteSession').disconnectSession(this.get('connection_name'));
        this.transitionToRoute('protected.apps');
      },

      disconnectVDI() {
        this.askDisconnect();
      },

      closeAll() {
        this.send('closeAllWindow');
      },
    }
  }
);
