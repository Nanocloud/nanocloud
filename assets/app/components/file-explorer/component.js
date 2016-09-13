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
  classNames: ['file-explorer-wrapper'],
  classBindings: ['noselect', 'transition-enabled-2'],
  publishError: false,
  store: Ember.inject.service('store'),
  session: Ember.inject.service('session'),
  loadState: false,
  displayBlueBorder: Ember.computed('lastObjectHovered', function() {
    if (this.get('lastObjectHovered') === 'current-folder') {
      return true;
    }
    return false;
  }),

  loadDirectory() {
    this.set('loadState', true);
    let parameters = {
      path: this.get('pathToString')
    };
    parameters[this.get('target')] = true;
    let loadFilesPromise = this.get('store').query(this.get('api'), parameters);
    this.set('items', loadFilesPromise);
    loadFilesPromise.then(() => {
      this.set('loadState', false);
    });
  },

  historyData: Ember.computed('history_offset', function() {
    return (this.pathToArray());
  }),

  init() {
    this.set('history', this.get('system') === 'windows' ? ['C:'] : ['']);
    this.set('history_offset', 0);
    this.loadDirectory();
    this._super(...arguments);
  },

  selectDir(dir) {
    this.incrementProperty('history_offset');
    this.goToDirectory(dir);
  },

  goToDirectory(folder) {
    this.get('history').pushObject(folder);
    var len = this.get('history').get('length');
    this.get('history').splice(this.get('history_offset'), (len-1) - this.get('history_offset'));
    this.loadDirectory();
  },

  goBack() {
    if (this.get('history_offset') <= 0) {
      return;
    }
    this.decrementProperty('history_offset');
    this.loadDirectory();
  },

  goNext() {
    if ((this.get('history_offset')+1) >= this.get('history').length) {
      return;
    }
    this.incrementProperty('history_offset');
    this.loadDirectory();
  },

  pathToArray() {
    var data = this.get('history');
    var offset = this.get('history_offset');
    var path = [];
    for (var i = 0; i <= offset; i++) {
      path.pushObject(data[i]);
    }
    return (path);
  },

  pathToString: Ember.computed('history', 'history_offset', function() {
    let data = this.get('history');
    let offset = this.get('history_offset');
    let separator = this.get('system') === 'windows' ? '\\' : '\/';
    let path = data.slice(0, offset + 1).join(separator) + separator;
    return path;
  }),

  downloadFile(filename) {
    let path = this.get('pathToString').substring(1) + filename;
    Ember.$.ajax({
      type: 'GET',
      headers: { Authorization : 'Bearer ' + this.get('session.access_token')},
      url: '/api/files/token',
      data: { filename: path }
    })
      .then((response) => {
        let url = '/api/files/download?' + this.get('target') + '=true&filename=' + encodeURIComponent(path) + '&token=' + encodeURIComponent(response.token);
        window.location.assign(url);
      });
  },

  actions: {

    moveOffset(offset) {
      this.set('history_offset', offset);
      this.loadDirectory();
    },

    clickItem(item) {
      if (item.get('isDir')) {
        this.selectDir(item.get('name'));
      } else {
        this.downloadFile(item.get('name'));
      }
    },

    setLastObjectHovered(item) {
      this.set('lastObjectHovered', item);
    },

    dragAction(item) {
      if (item.get('isDir')) {
        this.selectDir(item.get('name'));
      }
    },

    dropAction(item) {

      let targetDirectory = this.get('lastObjectHovered.name');
      if (targetDirectory === undefined) {
        targetDirectory = '';
      }
      else {
        targetDirectory += '/';
      }

      let old = this.get('elementBeingDraggedPath') + item.get('name');
      let dest = this.get('pathToString') + targetDirectory + item.get('name');

      Ember.$.ajax({
        type: 'PATCH',
        headers: { Authorization : 'Bearer ' + this.get('session.access_token')},
        url: '/api/files?filename=./' + old + '&newfilename=' + dest,
        data: {
          teams: true
        }
      })
        .then(() => {
          this.toast.success('File has been moved successfully');
          this.loadDirectory();
        }, () => {
          this.toast.error('File could not be moved');
        });
    },

    clickNextBtn() {
      this.goNext();
    },

    clickPrevBtn() {
      this.goBack();
    },

    newFolder() {
      this.set('newFolderPopup', true);
    },

    validateNewFolder() {
      this.set('newFolderPopup', false);
      let path = this.get('pathToString') + this.get('createFolderInput');
      Ember.$.ajax({
        type: 'POST',
        headers: { Authorization : 'Bearer ' + this.get('session.access_token')},
        url: '/api/files?filename=' + path,
        data: {
          teams: true
        }
      })
        .then(() => {
          this.toast.success('File has been created successfully');
          this.loadDirectory();
        }, () => {
          this.toast.error('File could not be created');
        });
    },

    renameItem(item) {
      let oldName = this.get('pathToString') + item;
      let newName = this.get('pathToString') + this.get('renameItem');
      Ember.$.ajax({
        type: 'PATCH',
        headers: { Authorization : 'Bearer ' + this.get('session.access_token')},
        url: '/api/files?filename=' + oldName + '&newfilename=' + newName,
        data: {
          teams: true
        }
      })
        .then(() => {
          this.toast.success('File has been renamed successfully');
          this.loadDirectory();
        }, () => {
          this.toast.error('File could not be renamed');
        });
    },

    removeItem(item) {

      let path = this.get('pathToString') + item.get('name');
      Ember.$.ajax({
        type: 'DELETE',
        headers: { Authorization : 'Bearer ' + this.get('session.access_token')},
        url: '/api/files?filename=' + path,
        data: {
          teams: true
        }
      })
        .then(() => {
          this.toast.success('File has been removed successfully');
          this.loadDirectory();
        }, () => {
          this.toast.error('File could not be removed');
        });
    }
  },
});
