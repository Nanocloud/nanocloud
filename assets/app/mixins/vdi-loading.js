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

/* global $:false */
export default Ember.Mixin.create({

  remoteSession: Ember.inject.service('remote-session'),
  isWaiting: !Ember.computed.equal('remoteSession.loadState', 'remoteSession.STATE_WAITING'),
  isConnecting: !Ember.computed.equal('remoteSession.loadState', 'remoteSession.STATE_CONNECTING'),
  plazaHasFinishedLoading: Ember.computed.alias('remoteSession.plazaHasFinishedLoading'),

  guacHasFinishedLoading: Ember.computed('remoteSession.loadState', function() {
    if (this.get('remoteSession.loadState') === 3) {
      return true;
    }
    return false;
  }),
  guacError: Ember.computed.gt('remoteSession.loadState', 3),

  vdiIsLoading: Ember.computed('guacHasFinishedLoading', 'plazaHasFinishedLoading', 'guacError', function() {
    if (this.get('guacHasFinishedLoading') && this.get('plazaHasFinishedLoading') && this.get('guacError') === false) {
      return false;
    }
    return true;
  }),
  showVdi: false,
  showVdiAnimation: function() {
    this.set('showVdi', false);
    if (this.get('vdiIsLoading') === false && this.get('guacError') === false) {
      Ember.run.later(() => {
        $('.vdi-load-background').velocity({
          opacity: 0
        }, {
          duration: 1000,
          begin: function() {
            $('.vdi-topbar').velocity({
              top: 0
            }, {
              duration: 1000,
              complete: function() {
                this.set('showVdi', true);
              }.bind(this)
            });
          }.bind(this)
        });
      }, 1500);
    }
    else if (this.get('guacError') === true) {
      this.set('showVdi', true);
    }
  }.observes('vdiIsLoading'),

  plazaStatus: Ember.computed('remoteSession.plazaHasFinishedLoading', function() {
    if (this.get('remoteSession.plazaHasFinishedLoading') === true) {
      return 'Ready.';
    }
    return 'Waiting..';
  }),

  vdiLoadError: Ember.computed('remoteSession.isError', function() {
    if (this.get('remoteSession.isError')) {
      return true;
    }
    return false;
  }),

  vdiLoadErrorMessage: Ember.computed('remoteSession.errorMessage', function() {
    return this.get('remoteSession.errorMessage') || 'Unknown error';
  }),

  init() {
    this._super(...arguments);
    this.get('vdiIsLoading');
  },

  updateAppStateToRunning() {
    this.set('remoteSession.plazaHasFinishedLoading', false);
    this.get('app')
      .then((record) => {
        record.set('state', 'running');
        record.save()
          .catch(() => {
            this.toast.error('Cannot start application');
          })
          .finally(() => {
            this.set('remoteSession.plazaHasFinishedLoading', true);
          });
      });
  },

  actions: {
    retryConnection() {
      this.get('remoteSession').resetState();
      this.get('remoteSession').setSession({
        connectionName: this.get('remoteSession.currentSession.connectionName')
      });
    },
    updateAppState() {
      this.updateAppStateToRunning();
    }
  }
});
