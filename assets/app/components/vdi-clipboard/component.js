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
import VdiWindowComponent from '../vdi-window/component';

export default VdiWindowComponent.extend({

  remoteSession: Ember.inject.service('remote-session'),
  localClipboardContent: null,

  updateCloudClipboardOnTyping: function() {
    this.get('remoteSession').setCloudClipboard(this.get('connectionName'), this.get('cloudClipboardContent'));
  }.observes('cloudClipboardContent'),

  init: function() {
    this._super(...arguments);
    var connectionName = this.get('connectionName');
    Ember.defineProperty(this, 'localClipboardContent', Ember.computed.alias(`remoteSession.openedGuacSession.${connectionName}.localClipboard`));
    Ember.defineProperty(this, 'cloudClipboardContent', Ember.computed.alias(`remoteSession.openedGuacSession.${connectionName}.cloudClipboard`));
  },


  actions: {

    savePasteToLocal() {
      this.get('remoteSession').setLocalClipboard(this.get('connectionName'), this.get('cloudClipboardContent'));
      Ember.$('.vdi-clipboard .done-msg').css('opacity', 0);
      Ember.$('.vdi-clipboard .done-msg')
        .velocity("stop")
        .velocity({ opacity: 1}, {
        duration: 400,
        complete: function() {
          setTimeout(function() {
            Ember.$('.vdi-clipboard .done-msg').velocity({ opacity: 0}, {
              duration: 400,
            });
          }, 4000);
        }
      });
    },

    clearClipboard() {
      this.set('cloudClipboardContent', '');
    }
  }
});

