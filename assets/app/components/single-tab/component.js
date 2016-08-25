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

const SAVE_IMAGE_STATE_DEFAULT = 0;
const SAVE_IMAGE_STATE_LOADING = 1;
const SAVE_IMAGE_STATE_SUCCESS = 2;
const SAVE_IMAGE_STATE_ERROR = 3;

export default Ember.Component.extend({

  /* global $:false */
  classNames: ['single-tab'],
  remoteSession: Ember.inject.service('remote-session'),
  session: Ember.inject.service('session'),
  showFileExplorer: false,

  connectionName: null,
  logoff: false,

  topBarItemToggleWindowCollector: {
    upload: false,
    clipboard: false,
    download: false,
  },

  showState: false,
  dragAndDropActive: false,
  windowIsSelected: false,
  store: Ember.inject.service('store'),
  saveImagePromptModal: false,
  saveImageState: SAVE_IMAGE_STATE_DEFAULT,

  manageOpenedWindow: function() {
    if (this.get('dragAndDropActive') === true) {
      this.closeAll();
    }
  }.observes('dragAndDropActive'),

  toggling() {

    if (this.get('showState') === false) {
      $('.canva-fullscreen').hide();
      $('.ember-modal-fullscreen').css('top: 100%');
      $('.ember-modal-fullscreen').velocity({ opacity: 1} , {
        easing: 'linear',
        duration: 300,
        complete: function() {
          $('.canva-fullscreen').show();
        }.bind(this),
      });

      this.set('showState', true);
    }
    else {
      this.closeAll();
      $('.ember-modal-overlay').velocity({ opacity: 0 }, {
        duration: 400
      });

      setTimeout(function() {
        this.set('showState', false);
        this.set('isVisible', false);
        this.sendAction('onClose');
      }.bind(this), 400);
    }
  },

  initialize: function() {
    this.toggling();
  }.on('becameVisible'),

  uploadIsVisible: Ember.computed('topBarItemToggleWindowCollector.upload', function() {
    return this.get('topBarItemToggleWindowCollector.upload');
  }),

  clipboardIsVisible: Ember.computed('topBarItemToggleWindowCollector.clipboard', function() {
    return this.get('topBarItemToggleWindowCollector.clipboard');
  }),

  downloadIsVisible: Ember.computed('topBarItemToggleWindowCollector.download', function() {
    return this.get('topBarItemToggleWindowCollector.download');
  }),

  closeAll() {
    var object = this.get('topBarItemToggleWindowCollector');
    this.set('windowIsSelected', false);
    for (var prop in object) {
      var objToBeSet = 'topBarItemToggleWindowCollector.' + prop;
      this.set(objToBeSet, false);
    }
  },

  handleToggling(element) {
    var state = this.get('topBarItemToggleWindowCollector.' + element);
    this.closeAll();
    if (!state) {
      this.set('topBarItemToggleWindowCollector.' + element, true);
      this.set('windowIsSelected', true);
    }
    else {
      this.set('topBarItemToggleWindowCollector.' + element, false);
    }
  },

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
      this.toggling();
    });
  },

  vdiIsLoading: Ember.computed('remoteSession.loadState', 'remoteSession.plazaHasFinishedLoading', function() {
    if (this.get('remoteSession.loadState') !== this.get('remoteSession.STATE_WAITING') &&
      this.get('remoteSession.loadState') !== this.get('remoteSession.STATE_CONNECTING') &&
      this.get('remoteSession.plazaHasFinishedLoading')) {
      return false;
    }
    return true;
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

  vdiLoadOrError: Ember.computed('vdiIsLoading', 'vdiLoadError', function() {
    if (this.get('vdiIsLoading') || this.get('vdiLoadError')) {
      return true;
    }
    return false;
  }),

  handleFileExplorerModalInputs: function() {
    if (this.get('showFileExplorer')) {
      this.get('remoteSession').pauseInputs(this.get('connectionName'));
    }
    else {
      this.get('remoteSession').restoreInputs(this.get('connectionName'));
    }
  }.observes('showFileExplorer'),

  onConnectionNameChange: function() {
  }.observes('connectionName'),

  saveImage() {
    this.set('saveImageState', SAVE_IMAGE_STATE_LOADING);
    this.get('store').createRecord('image', {
    })
    .save()
    .then(() => {
      this.set('saveImageState', SAVE_IMAGE_STATE_SUCCESS);
    })
    .catch(() => {
      this.set('saveImageState', SAVE_IMAGE_STATE_ERROR);
    });
  },

  saveImageStateDefault: Ember.computed.equal('saveImageState', SAVE_IMAGE_STATE_DEFAULT),
  saveImageStateLoading: Ember.computed.equal('saveImageState', SAVE_IMAGE_STATE_LOADING),
  saveImageStateSuccess: Ember.computed.equal('saveImageState', SAVE_IMAGE_STATE_SUCCESS),
  saveImageStateError: Ember.computed.equal('saveImageState', SAVE_IMAGE_STATE_ERROR),

  actions: {

    clickOnboardApp() {
      this.set('onboardApp', true);
      this.send('toggleSaveImagePrompt');
    },

    toggleSaveImagePrompt() {
      this.toggleProperty('saveImagePromptModal');
    },

    saveImagePromptAnswerNo() {
      this.toggleProperty('saveImagePromptModal');
      if (this.get('onboardApp')) {
        if (this.get('saveImageState') !== SAVE_IMAGE_STATE_ERROR) {
          this.send('toggleFileExplorer');
        }
      }
      this.set('saveImageState', SAVE_IMAGE_STATE_DEFAULT);
      this.set('onboardApp', false);
    },

    saveImagePromptAnswerYes() {
      this.saveImage();
    },

    toggleFileExplorer() {
      this.toggleProperty('showFileExplorer');
    },

    closeFileExplorer() {
      this.set('showFileExplorer', false);
    },

    openFileExplorer() {
      this.set('showFileExplorer', true);
    },

    retryConnection() {
      this.sendAction('retryConnection', this.get('connectionName'));
    },

    closeAll() {
      this.closeAll();
    },

    disconnectVDI(message) {
      this.vdiDisconnectHandler(message);
    },

    toggleSingleTab() {
      this.toggling();
    },

    toggleUploadWindow() {
      this.handleToggling('upload');
    },

    toggleClipboardWindow() {
      this.handleToggling('clipboard');
    },

    toggleDownloadWindow() {
      this.handleToggling('download');
    },
  }
});
