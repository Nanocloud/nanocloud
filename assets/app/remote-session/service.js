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
import config from 'nanocloud/config/environment';

/* global Guacamole, $:false */

export default Ember.Service.extend(Ember.Evented, {
  STATE_IDLE: 0,
  STATE_WAITING: 2,
  STATE_CONNECTED: 3,
  STATE_DISCONNECTED: 5,

  session: Ember.inject.service('session'),
  openedGuacSession: Ember.Object.create({}),
  guacToken: Ember.computed('session', 'session.access_token', function() {
    return Ember.$.post(config.GUACAMOLE_URL + 'api/tokens', {
      access_token: this.get('session.access_token')
    });
  }),
  currentSession: {
    connectionName: null,
    retry_count: 0,
    element: null,
  },

  _forgeConnectionString: function(token, connectionName, width, height) {

    // Calculate optimal width/height for display
    var pixel_density = Ember.$(this.get('element')).devicePixelRatio || 1;
    var optimal_dpi = pixel_density * 96;
    var optimal_width = width * pixel_density;
    var optimal_height = height * pixel_density;

    // Build base connect string
    var connectString =
        'token='             + token +
        '&GUAC_DATA_SOURCE=' + 'noauthlogged' +
        '&GUAC_ID='          + connectionName +
        '&GUAC_TYPE='        + 'c' + // connection
        '&GUAC_WIDTH='       + Math.floor(optimal_width) +
        '&GUAC_HEIGHT='      + Math.floor(optimal_height) +
        '&GUAC_DPI='         + Math.floor(optimal_dpi);

    // Add audio mimetypes to connect string
    connectString += '&GUAC_AUDIO=' + 'audio%2Fwav';

    // Add video mimetypes to connect string
    connectString += '&GUAC_VIDEO=' + 'video%2Fmp4';

    return connectString;
  },

  keyboardAttach(connectionName) {

    let guacSession = this.get('openedGuacSession')[connectionName];
    var guacamole = guacSession.guacamole;
    var keyboard = guacSession.keyboard;

    if (!keyboard) {
      keyboard = this.get('openedGuacSession')[connectionName].keyboard = new window.Guacamole.Keyboard(document);
    }

    keyboard.onkeydown = function (keysym) {
      guacamole.sendKeyEvent(1, keysym);
    }.bind(this);

    keyboard.onkeyup = function (keysym) {
      guacamole.sendKeyEvent(0, keysym);
    }.bind(this);
  },

  getSession: function(connectionName) {

    this.notifyPropertyChange('guacToken');
    return this.get('guacToken').then((token) => {

      let width = $(window).width();
      let height = $(window).height() - 25;

      let tunnel = new Guacamole.WebSocketTunnel('/guacamole/websocket-tunnel?' + this._forgeConnectionString(token.authToken, connectionName, width, height));
      let guacamole = new Guacamole.Client(
        tunnel
      );
      let guacSession = {
        guacamole: guacamole,
        tunnel: tunnel,
      };
      this.set('openedGuacSession.' + connectionName, Ember.Object.create(guacSession));
      return guacSession;
    }, () => {
      this.stateChanged(this.get('STATE_DISCONNECTED'), true, 'Could not authenticate session');
    });
  },

  copyTextToClipboard(text) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  },

  pauseInputs(connectionName) {
    if (!this.get('openedGuacSession')[connectionName]) {
      return;
    }
    if (this.get('openedGuacSession')[connectionName].keyboard) {
      this.get('openedGuacSession')[connectionName].keyboard.reset();
      this.get('openedGuacSession')[connectionName].keyboard.onkeyup = null;
      this.get('openedGuacSession')[connectionName].keyboard.onkeydown = null;
      delete this.get('openedGuacSession')[connectionName].keyboard;
    }
  },

  restoreInputs(connectionName) {
    if (this.get('openedGuacSession')[connectionName]) {
      this.keyboardAttach(connectionName);
    }
  },

  setCloudClipboard(connectionName, content) {

    if (this.get('openedGuacSession')[connectionName]) {
      this.set('openedGuacSession.' + connectionName + '.cloudClipboard', content);
      this.get('openedGuacSession')[connectionName].guacamole.setClipboard(content);
    }
  },

  setLocalClipboard(connectionName, content) {

    if (this.get('openedGuacSession')[connectionName]) {
      this.copyTextToClipboard(content);
      this.set('openedGuacSession.' + connectionName + '.localClipboard', content);
    }
  },

  disconnectSession(connectionName, element) {
    let guacSession = this.get('openedGuacSession')[connectionName];
    if (guacSession) {
      if (element) {
        try {
          element.removeChild(guacSession.guacamole.getDisplay().getElement());
        }
        catch(error) {
          return;
        }
      }
      this.pauseInputs(connectionName);
      this.get('openedGuacSession')[connectionName].guacamole.disconnect();
    }
  },

  disconnectCurrentSession() {
    this.disconnectSession(this.get('currentSession.connectionName'), this.get('currentSession.element'));
  },

  resetState(){
    this.set('loadState', this.get('STATE_IDLE'));
  },

  stateChanged(state, isError, errorMessage) {
    if (isError) {
      this.set('isError', true);
    }
    if (errorMessage) {
      this.set('errorMessage', errorMessage);
    }
    this.set('loadState', state);
    if (state === this.get('STATE_CONNECTED')) {
      this.trigger('connected');
    }
  },

  attachInputs(connectionName) {
    this.keyboardAttach(connectionName);
    let mouse = new window.Guacamole.Mouse(this.get('openedGuacSession')[connectionName].guacamole.getDisplay().getElement());
    let display = this.get('openedGuacSession')[connectionName].guacamole.getDisplay();
    window.onresize = function() {
      let width = $(window).width();
      let height = $(window).height() - 25;
      this.get('openedGuacSession')[connectionName].guacamole.sendSize(width, height);
    }.bind(this);

    mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = function(mouseState) {
      this.get('openedGuacSession')[connectionName].guacamole.sendMouseState(mouseState);
    }.bind(this);

    display.oncursor = function(canvas, x, y) {
      display.showCursor(!mouse.setCursor(canvas, x, y));
    };
  },

  setSession(connectionData) {
    this.set('currentSession.connectionName', connectionData.connectionName);
    if (this.get('currentSession.retry_count') !== null) {
      this.incrementProperty('currentSession.retry_count');
    }
    else {
      this.set('currentSession.retry_count', 0);
    }
  },
});
