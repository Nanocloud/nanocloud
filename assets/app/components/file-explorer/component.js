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
  isVisible: false,
  publishError: false,
  store: Ember.inject.service('store'),
  loadState: false,

  loadDirectory() {
    this.set('selectedFile', null);
    this.set('loadState', true);
    let loadFilesPromise = this.get('store').query(this.get('api'), {
      machines: true,
      path: this.get('pathToString')
    });
    this.set('items', loadFilesPromise);
    loadFilesPromise.then(() => {
      this.set('loadState', false);
    });
  },

  historyData: Ember.computed('history_offset', function() {
    return (this.pathToArray());
  }),

  becameVisible: function() {
    this.set('history', [ 'C:' ]);
    this.set('history_offset', 0);
    this.loadDirectory();
  },

  selectFile(file) {
    if (this.get('selectedFile') !== file) {
      this.set('selectedFile', file);
    }
    else {
      this.set('selectedFile', null);
    }
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
    let path = data.slice(0, offset + 1).join('\\') + '\\';
    return path;
  }),

  publishSelectedFile() {

    let name = this.get('selectedFile').get('name').replace(/\.[^/.]+$/, '');

    let m = this.get('store').createRecord('app', {
      alias: name,
      displayName: name,
      collectionName: 'collection',
      filePath: this.get('pathToString') + this.get('selectedFile.name')
    });

    this.set('isPublishing', true);
    m.save()
      .then(() => {
        this.set('isPublishing', false);
        this.toggleProperty('isVisible');
        this.toast.success('Your application has been published successfully');
        this.sendAction('action');
      }, (error) => {
        this.set('isPublishing', false);
        this.set('publishError', true);
        this.set('selectedFile', null);
        this.toast.error(error.errors[0].status + ' : ' + error.errors[0].title);
      });
  },

  selectedFilePath: Ember.computed('pathToString', 'selectedFile', function() {
    return (this.get('pathToString') + this.get('selectedFile').get('name'));
  }),

  actions: {

    moveOffset(offset) {
      this.set('history_offset', offset);
      this.loadDirectory();
    },

    toggleFileExplorer() {
      this.toggleProperty('isVisible');
    },

    clickItem(item) {
      if (item.get('isDir')) {
        this.selectDir(item.get('name'));
      } else {
        this.selectFile(item);
      }
    },

    clickPublish() {
      this.publishSelectedFile();
    },

    clickNextBtn() {
      this.goNext();
    },

    clickPrevBtn() {
      this.goBack();
    },
  }
});
