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
import fileExplorer from 'nanocloud/components/file-explorer/component';

export default fileExplorer.extend({
  publishError: false,

  loadDirectory() {
    this.set('selectedFile', null);
    this._super(...arguments);
  },

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
        this.toast.success('Your application has been published successfully');
        this.sendAction('action');
      }, (error) => {
        this.set('isPublishing', false);
        this.set('publishError', true);
        this.set('selectedFile', null);
        this.toast.error(error.errors[0].status + ' : ' + error.errors[0].title);
      });
  },

  selectFile(file) {
    if (this.get('selectedFile') !== file) {
      this.set('selectedFile', file);
    }
    else {
      this.set('selectedFile', null);
    }
  },

  selectedFilePath: Ember.computed('pathToString', 'selectedFile', function() {
    return (this.get('pathToString') + this.get('selectedFile').get('name'));
  }),

  actions: {

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
  }
});
