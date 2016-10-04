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
var FileUploader = Ember.Object.extend(Ember.Evented, {
  completed: false,
  progress: 0,
  uploading: false,
  forbidden: false,

  init() {
    this._super(...arguments);
    this.startUpload();
  },

  name: Ember.computed('file', function() {
    return this.get('file').name;
  }),

  startUpload() {
    let req = new XMLHttpRequest();

    this.set('req', req);

    req.open('POST', '/api/upload?filename=' + encodeURIComponent(this.get('file').name));
    req.setRequestHeader('Authorization', 'Bearer ' + this.get('token'));

    req.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        let p = event.loaded / event.total;
        if (p === 1) {
          this.set('uploading', false);
        }
        this.set('progress', Math.round(event.loaded / event.total * 100));
      }
    };

    req.onload = (res) => {
      if (res.target.status === 403) {
        this.set('forbidden', true);
        this.trigger('forbidden');
      } else {
        this.set('completed', true);
        this.trigger('completed');
      }
      this.set('uploading', false);
    };

    this.set('uploading', true);

    var formData = new FormData();
    formData.append(this.get('file').name, this.get('file'));

    req.send(formData);
  },

  cancel(preventEvent) {
    this.get('req').abort();
    this.set('uploading', false);

    if (!preventEvent) {
      this.trigger('canceled');
    }
  }
});

export default Ember.Component.extend({
  classNames: ['vdi-drag-n-drop'],
  classNameBindings: ['show:state-show:state-hide'],
  session: Ember.inject.service('session'),
  store: Ember.inject.service('store'),
  configuration: Ember.inject.service('configuration'),

  progress: Ember.computed('queue.@each.uploading', 'queue.@each.progress', function() {
    let q = this.get('queue');
    let len = q.get('length');
    if (len) {
      return Math.round(q.filterBy('uploading').reduce((a, b) => a + b.get('progress'), 0) / q.get('length'));
    } else {
      return 0;
    }
  }),

  uploading: Ember.computed('queue.@each.uploading', function() {
    return this.get('queue').isAny('uploading');
  }),

  show: false,
  queue: null,
  state: null,

  init: function() {
    this._super(...arguments);
    Ember.$('body').off('dragenter dragover');
    this.set('queue', Ember.A([]));
  },

  showElement() {
    this.set('show', true);
  },

  hideElement() {
    this.set('show', false);
  },

  dragLeave() {
    this.set('dragAndDropActive', false);
    this.hideElement();
  },

  drop(event) {
    event.preventDefault();
    this.set('dragAndDropActive', false);
    this.hideElement();

    this.startDownload(event.dataTransfer.files);
    this.sendAction('onDrop');
  },

  checkUploadLimit(fileSize) {
    return this.get('store').query('file', { filename: './' })
      .then((res) => {
        let sum = parseInt(res.meta.storageSize, 10) * 1024 + parseInt(fileSize, 10);
        let max = parseInt(this.get('configuration.uploadLimit'), 10) * 1048576;
        if (sum > max && max !== 0) {
          return false;
        } else {
          return true;
        }
      });
  },

  startDownload(files){
    let q = this.get('queue');

    Array.prototype.forEach.call(files, (file) => {
      this.checkUploadLimit(file.size)
        .then((res) => {
          if (res) {
            let f = FileUploader.create({
              file: file,
              token: this.get('session.access_token')
            });
            f.one('completed', this, this.completeNotif);
            f.one('forbidden', this, this.limitNotif);
            f.one('canceled', this, this.abortNotif);
            q.pushObject(f);
          } else {
            this.limitNotif();
          }
        });
    });
  },

  removeCompleteDownload() {
    let q = this.get('queue');
    let len = q.get('length');
    let i = 0;

    while (i < len) {
      if (!q.objectAt(i).get('uploading')) {
        q.removeAt(i);
        --len;
      } else {
        ++i;
      }
    }
  },

  didInsertElement() {
    Ember.$('body').on('dragenter dragover', (event) => {
      event.preventDefault();

      this.set('show', true);
      if (this.get('dragAndDropActive') === false) {
        this.set('dragAndDropActive', true);
        this.showElement();
      }
    });

    if (this.get('assignBrowse')) {
      var input = $('<input>', { type: 'file' })
      .css({
        visibility: 'hidden',
        position: 'absolute',
        width: '1px',
        height: '1px'
      })
      .on('change', (event) => {
        this.startDownload(event.target.files);
      });
      $('.' + this.get('assignBrowse'))
        .after(input)
        .on('click', function() {
          input.click();
        });
    }
  },

  completeNotif() {
    this.sendAction('complete');
    this.toast.success('Upload successful');
  },

  abortNotif() {
    this.toast.info('Abort successful');
  },

  limitNotif() {
    this.toast.error('The upload limit is reached');
  },

  downloadCompleted() {
    if (this.get('state') !== 'Aborted') {
      this.completeNotif();

      this.set('state', 'Completed');
      Ember.run.next(() => {
        Ember.$('.state').fadeOut(700, () => {
          this.set('state', null);
          Ember.$('.state').fadeIn(0);
        });
      }, 3000);
    }
    else {
      this.set('state', null);
    }
  },

  stopUpload() {
    this.get('queue').invoke('cancel', true);
    this.abortNotif();
    this.set('state', 'Aborted');
    this.downloadCompleted();
  },

  actions: {
    cancelUpload() {
      this.stopUpload();
    },

    flushHistory() {
      this.removeCompleteDownload();
    }
  },
});
