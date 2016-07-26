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

  /* global $:false */
  classNames: ['single-tab'],
  remoteSession: Ember.inject.service('remote-session'),
  session: Ember.inject.service('session'),

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
  store: Ember.inject.service(),
  savePackageModal: false,
  savePackageName: "",

  RECORD_DEFAULT: 0,
  RECORD_WAIT: 1,
  RECORD_CAPTURING: 2,
  RECORD_PACKAGING: 3,
  recordState: 0,

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
        easing: "linear",
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
      type: "DELETE",
      headers: { Authorization : "Bearer " + this.get('session.access_token')},
      url: "/api/sessions",
      data: { user: "./" + this.get('session.user')}
    })
    .then(() => {
      this.set('logoff', false);
      if (!options) {
        this.toast.success("You have been disconnected successfully");
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
    return this.get('remoteSession.errorMessage') || "Unknown error";
  }),

  vdiLoadOrError: Ember.computed('vdiIsLoading', 'vdiLoadError', function() {
    if (this.get('vdiIsLoading') || this.get('vdiLoadError')) {
      return true;
    }
    return false;
  }),

  becameVisible() {
    this.set('savePackageModal', false);
    this.set('savePackageName', "");
    this.set('recordState', this.get("RECORD_DEFAULT"));
  },

  handlePackageModalInputs: function() {
    if (this.get('savePackageModal')) {
      this.get('remoteSession').pauseInputs(this.get('connectionName'));
    }
    else {
      this.get('remoteSession').restoreInputs(this.get('connectionName'));
    }
  }.observes('savePackageModal'),

  onConnectionNameChange: function() {
  }.observes('connectionName'),

  recordingIsAvailable: Ember.computed('session.user.isAdmin', 'connectionName', function() {
    return (this.get('session.user.isAdmin') === true && this.get('connectionName') === 'Desktop');
  }),

  isRecording: Ember.computed('topBarItemToggleWindowCollector.record', function() {
    return this.get('topBarItemToggleWindowCollector.record');
  }),

  recordBlink: Ember.computed('color', function() {
    return Ember.String.htmlSafe('color: red;');
  }),

  setRecordItemInCollector: function() {
    this.topBarItemToggleWindowCollector.record = false;
  }.on('init'),

  recordingOnWait: Ember.computed('recordState', function() {
    if (this.get('recordState') === this.get('RECORD_WAIT')) {
      return true;
    }
    return false;
  }),

  recordingOnDefault: Ember.computed('recordState', function() {
    if (this.get('recordState') === this.get('RECORD_DEFAULT')) {
      return true;
    }
    return false;
  }),

  recordingOnCapturing: Ember.computed('recordState', function() {
    if (this.get('recordState') === this.get('RECORD_CAPTURING')) {
      return true;
    }
    return false;
  }),

  recordingOnPackaging: Ember.computed('recordState', function() {
    if (this.get('recordState') === this.get('RECORD_PACKAGING')) {
      return true;
    }
    return false;
  }),

  actions: {

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

    savePackage() {

      let name = this.get('savePackageName');
      let app = this.get('currentApplication');

      Ember.$.ajax({
        type: "PATCH",
        headers: { 
          "Content-type": "application/json",
          Authorization : "Bearer " + this.get('session.access_token'),
        },
        url: "/api/apps/" + app.get("id"),
        data: JSON.stringify({
          "data":{  
            "attributes":{  
              "display-name": name,
            },
            "id": app.get("id"), 
            "type": "apps",
          }
        })
      })
      .then(() => {
        this.set('savePackageModal', false);
        this.toast.success("Packaging successful");
      }, (() => {
        this.set('savePackageModal', false);
        this.toast.error("Couldn't give a name to your package");
      }));
    },

    toggleRecordWindow() {
      let getMachine = function() {
        let promise = new Ember.RSVP.Promise((resolve, reject) => {

          this.get('store').query('machines/user', {})
            .then((machines) => {
              if (machines.get('length') === 0) {
                return reject('Could determine current machine');
              }
              let machine = machines.get('firstObject');
              return resolve(machine);
            });
        });

        return promise;
      }.bind(this);

      var stateBeforeWaiting = this.get('recordState');
      this.set('recordState', this.get('RECORD_WAIT'));

      if (stateBeforeWaiting === this.get("RECORD_CAPTURING")) {
        getMachine().then((machine) => {
          this.set('recordState', this.get('RECORD_PACKAGING'));
          Ember.$.ajax({
            type: "PATCH",
            "Content-type" : "application/json",
            headers: { 
              Authorization : "Bearer " + this.get('session.access_token'),
            },
            url: "/api/machines/" + machine.get('id'),
            data: JSON.stringify({
                "data":{  
                  "attributes":{  
                    "id": machine.get('id'),
                    "name":machine.get('name'),
                    "ip":machine.get('ip'),
                    "status":machine.get('status'),
                    "username":machine.get('username'),
                    "platform":machine.get('platform'),
                    "progress":machine.get('progress'),
                    "recording":"packaging",
                    "timeleft":machine.get('timeleft')
                  },
                  "id":machine.get('id'),
                  "type":"machines"
                }
              })
          })
          .then((data) => {
            this.set('savePackageModal', true);
            var currentApplication = this.get('store').createRecord('app', {
              "id":data.included["id"],
              "collection-name":data.included.attributes["collection-name"],
              "alias":data.included.attributes["alias"],
              "display-name":data.included.attributes["display-name"],
              "file-path":data.included.attributes["file-path"],
              "path": data.included.attributes["path"],
              "icon-content":data.included.attributes["icon-content"],
              "state":data.included.attributes["state"],
            });

            this.set('currentApplication', currentApplication);
            this.toast.info('Ending recording');
            this.set('recordState', this.get('RECORD_DEFAULT'));
          }, ((reason) => {
            this.toast.error(reason);
            this.set('recordState', this.get('RECORD_DEFAULT'));
          }));

        });
      } else {
        getMachine().then((machine) => {
          machine.set('recording', "capturing");
          machine.save()
            .then(() => {
              this.set('recordState', this.get('RECORD_CAPTURING'));
              this.toast.info('Starting recording');
            })
            .catch((reason) => {
              this.set('recordState', this.get('RECORD_DEFAULT'));
              this.toast.error(reason);
            });
        });
      }
    },
  }
});
