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

/* globals Guacamole */

import Ember from 'ember';
import getKeyFromVal from '../../utils/get-key-from-value';

export default Ember.Component.extend({
  remoteSession: Ember.inject.service('remote-session'),
  guacamole: null,
  connectionName: null,
  plazaHasFinishedLoading: false,

  getWidth: function() {
    return Ember.$(this.element).parent().width();
  },

  getHeight: function() {
    return Ember.$(this.element).parent().height();
  },

  initialize: function() {
    if (this.get('autoload') === true) {
      this.connect();
    }
  }.on('didRender'),

  connect: function() {

    if (Ember.isEmpty(this.get('connectionName'))) {
      return ;
    }

    let width = this.getWidth();
    let height = this.getHeight();

    let guacamole = this.get('remoteSession').getSession(this.get('connectionName'), width, height);
    this.set('guacamole', guacamole);
    guacamole.then((guacData) => {

      guacData.tunnel.onerror = function(status) {
        this.get('element').removeChild(guacData.guacamole.getDisplay().getElement());
        var message = 'Opening a WebSocketTunnel has failed';
        var code = getKeyFromVal(Guacamole.Status.Code, status.code);
        if (code !== -1) {
          message += ' - ' + code;
        }
        this.get('remoteSession').stateChanged(this.get('remoteSession.STATE_DISCONNECTED'), true, message);
        this.get('remoteSession').disconnectSession(this.get('connectionName'));
        this.sendAction('onError', {
          error : true,
          message: 'You have been disconnected due to some error'
        });
      }.bind(this);
      let guac = guacData.guacamole;

      guac.onfile = function(stream, mimetype, filename) {
        let blob_reader = new Guacamole.BlobReader(stream, mimetype);

        blob_reader.onprogress = function() {
          stream.sendAck('Received', Guacamole.Status.Code.SUCCESS);
        }.bind(this);

        blob_reader.onend = function() {
          //Download file in browser
          var element = document.createElement('a');
          element.setAttribute('href', window.URL.createObjectURL(blob_reader.getBlob()));
          element.setAttribute('download', filename);
          element.style.display = 'none';
          document.body.appendChild(element);

          element.click();

          document.body.removeChild(element);
        }.bind(this);

        stream.sendAck('Ready', Guacamole.Status.Code.SUCCESS);
      }.bind(this);

      guac.onstatechange = (state) => {
        this.get('remoteSession').stateChanged(state);
      };

      guac.onclipboard = function(stream, mimetype) {

        let blob_reader = new Guacamole.BlobReader(stream, mimetype);
        blob_reader.onprogress = function() {
          stream.sendAck('Received', Guacamole.Status.Code.SUCCESS);
        }.bind(this);

        blob_reader.onend = function() {
          var arrayBuffer;
          var fileReader = new FileReader();
          fileReader.onload = function(e) {
            arrayBuffer = e.target.result;
            this.get('remoteSession').setCloudClipboard(this.get('connectionName'), arrayBuffer);
            if (navigator.userAgent.indexOf('Chrome') !== -1) {
              window.postMessage({type: 'VDIExperience', value: arrayBuffer}, '*');
            }
          }.bind(this);
          fileReader.readAsText(blob_reader.getBlob());
        }.bind(this);
      }.bind(this);

      this.get('element').appendChild(guac.getDisplay().getElement());

      this.get('remoteSession').keyboardAttach(this.get('connectionName'));
      let mouse = new window.Guacamole.Mouse(guac.getDisplay().getElement());
      let display = guac.getDisplay();
      window.onresize = function() {
        let width = this.getWidth();
        let height = this.getHeight();

        guac.sendSize(width, height);
      }.bind(this);

      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = function(mouseState) {
        guac.sendMouseState(mouseState);
      }.bind(this);

      display.oncursor = function(canvas, x, y) {
        display.showCursor(!mouse.setCursor(canvas, x, y));
      };

      guac.connect();
    });
  }.observes('connectionName', 'activator').on('becameVisible'),
});
