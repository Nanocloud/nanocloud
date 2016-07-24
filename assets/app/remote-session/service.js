import Ember from 'ember';
import config from 'nanocloud/config/environment';

/* global Guacamole */

export default Ember.Service.extend(Ember.Evented, {
  STATE_IDLE: 0,
  STATE_WAITING: 2,
  STATE_CONNECTED: 3,
  STATE_DISCONNECTED: 5,

  session: Ember.inject.service('session'),
  guacamole: null,
  openedGuacSession: Ember.Object.create({}),
  guacToken: Ember.computed('session.user', 'guacToken', function() {
    return Ember.$.post(config.GUACAMOLE_URL + 'api/tokens', {
      access_token: this.get('session.access_token')
    });
  }),

  _forgeConnectionString: function(token, connectionName, width, height) {

    // Calculate optimal width/height for display
    var pixel_density = Ember.$(this.get('element')).devicePixelRatio || 1;
    var optimal_dpi = pixel_density * 96;
    var optimal_width = width * pixel_density;
    var optimal_height = height * pixel_density;

    // Build base connect string
    var connectString =
        "token="             + token +
        "&GUAC_DATA_SOURCE=" + "noauthlogged" +
        "&GUAC_ID="          + connectionName +
        "&GUAC_TYPE="        + "c" + // connection
        "&GUAC_WIDTH="       + Math.floor(optimal_width) +
        "&GUAC_HEIGHT="      + Math.floor(optimal_height) +
        "&GUAC_DPI="         + Math.floor(optimal_dpi);

    // Add audio mimetypes to connect string
    connectString += "&GUAC_AUDIO=" + "audio%2Fwav";

    // Add video mimetypes to connect string
    connectString += "&GUAC_VIDEO=" + "video%2Fmp4";

    return connectString;
  },

  keyboardAttach(name) {

    var session = this.get('openedGuacSession')[name];
    var guacamole = session.guac;
    var keyboard = session.keyboard;

    if (!keyboard) {
      keyboard = this.get('openedGuacSession')[name].keyboard = new window.Guacamole.Keyboard(document);
    }

    keyboard.onkeydown = function (keysym) {
      guacamole.sendKeyEvent(1, keysym);
    }.bind(this);

    keyboard.onkeyup = function (keysym) {
      guacamole.sendKeyEvent(0, keysym);
    }.bind(this);
  },

  getSession: function(name, width, height) {

    this.set('isError', false);
    return this.get('guacToken').then((token) => {

      let tunnel = new Guacamole.WebSocketTunnel('/guacamole/websocket-tunnel?' + this._forgeConnectionString(token.authToken, name, width, height));
      let guacamole = new Guacamole.Client(
        tunnel
      );
      this.set('openedGuacSession.' + name, Ember.Object.create({ guac : guacamole }));

      return  {
        tunnel : tunnel,
        guacamole: guacamole
      };
    }, () => {
      this.stateChanged(this.get('STATE_DISCONNECTED'), true, "Could not authenticate session");
    });
  },

  copyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  },

  pauseInputs(name) {
    if (!this.get('openedGuacSession')[name]) {
      return;
    }
    if (this.get('openedGuacSession')[name].keyboard) {
      this.get('openedGuacSession')[name].keyboard.reset();
      this.get('openedGuacSession')[name].keyboard.onkeyup = null;
      this.get('openedGuacSession')[name].keyboard.onkeydown = null;
      delete this.get('openedGuacSession')[name].keyboard;
    }
  },

  restoreInputs(name) {
    if (this.get('openedGuacSession')[name]) {
      this.keyboardAttach(name);
    }
  },

  setCloudClipboard(name, content) {

    if (this.get('openedGuacSession')[name]) {
      this.set('openedGuacSession.' + name + '.cloudClipboard', content);
      this.get('openedGuacSession')[name].guac.setClipboard(content);
    }
  },

  setLocalClipboard(name, content) {

    if (this.get('openedGuacSession')[name]) {
      this.copyTextToClipboard(content);
      this.set('openedGuacSession.' + name + '.localClipboard', content);
    }
  },

  getCloudClipboard(name) {
    if (this.get('openedGuacSession')[name]) {
      return this.get('openedGuacSession')[name].cloudClipboard;
    }
    return "";
  },

  getLocalClipboard(name) {
    if (this.get('openedGuacSession')[name]) {
      return this.get('openedGuacSession')[name].localClipboard;
    }
    return "";
  },

  disconnectSession(name) {
    this.pauseInputs(name);
    if (this.get('openedGuacSession')[name]) {
      this.get('openedGuacSession')[name].guac.disconnect();
      delete this.get('openedGuacSession')[name];
    }
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
});
