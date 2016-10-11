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

/*
 * KeyboardManager
 */
var KeyboardManager  = function(element, rtcChannel) {
  this._element = element;
  this._rtcChannel = rtcChannel;

  var keyevent = function(event) {
    event.preventDefault();
    rtcChannel.send(((event.type === 'keydown') ? 'D':'U') + String.fromCharCode(event.keyCode));
  };

  element.addEventListener('keydown', keyevent);
  element.addEventListener('keyup', keyevent);
};

/*
 * MouseManager
 */

var MouseManager = function(element, rtcChannel) {
  this._element = element;
  this._rtcChannel = rtcChannel;

  var mouseButtonEvent = function(event) {
    event.preventDefault();

    var mess = 'C';

    if (event.type === 'mousedown') {
      mess += 'D';
    } else {
      mess += 'U';
    }

    if (event.button === 0) { // Left button
      mess += 'L';
    } else { // Right button
      mess += 'R';
    }

    rtcChannel.send(mess);
  };

  element.addEventListener('contextmenu', function(event) {
    event.preventDefault();
  });

  element.addEventListener('mousedown', mouseButtonEvent);
  element.addEventListener('mouseup', mouseButtonEvent);
  element.addEventListener('mousewheel', function(event) {
    event.preventDefault();
    rtcChannel.send('W' + event.wheelDelta);
  });

  element.addEventListener('mousemove', this._OnMove.bind(this));
};

MouseManager.prototype._OnMove = function(event) {
  var x = event.offsetX * 0xFFFF / this._element.clientWidth;
  var y = event.offsetY * 0xFFFF / this._element.clientHeight;

  this._rtcChannel.send('M' + Math.floor(x) + '|' + Math.floor(y));
};


var PeerConnectionManager = function(videoElement, serverAddress) {
  this._videoElement = videoElement;
  this._serverAddress = serverAddress;

  var peerConnection = new RTCPeerConnection({
    iceServers:[{
      urls: ['stun:stun.l.google.com:19302']
    }]
  }, {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  });

  this._peerConnection = peerConnection;

  peerConnection.onicecandidate = this._OnICECandidate.bind(this);
  peerConnection.onaddstream = this._OnAddStream.bind(this);

  var dataChannel = peerConnection.createDataChannel('userinput', {
    ordered: true,
    reliable: true
  });
  this._dataChannel = dataChannel;

  dataChannel.onopen = this._OnDataChannelOpen.bind(this);

  peerConnection.createOffer(function(offer) {
    peerConnection.setLocalDescription(offer);
  }, function() {
  }, {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  });
};

PeerConnectionManager.prototype._OnDataChannelOpen = function() {
  var mouseManager = new MouseManager(this._videoElement, this._dataChannel);
  var keyboardManager = KeyboardManager(document.body, this._dataChannel);

  return [
    mouseManager,
    keyboardManager
  ];
};

PeerConnectionManager.prototype._OnICECandidate = function(event) {
  var self = this;

  if (event.candidate === null) {
    var sdp = this._peerConnection.localDescription.sdp;

    var req = new XMLHttpRequest();

    req.open('POST', this._serverAddress, true);

    req.onreadystatechange = function () {
      if (req.readyState !== 4 || req.status !== 200) {
        return;
      }
      var answer = req.responseText;
      self._peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answer
      }));
    };

    req.send(sdp);
  }
};

PeerConnectionManager.prototype._OnAddStream = function(event) {
  var url = URL.createObjectURL(event.stream);
  this._videoElement.src = url;
};


export default Ember.Component.extend({
  remoteSession: Ember.inject.service('remote-session'),
  guacamole: null,
  connectionName: null,
  plazaHasFinishedLoading: false,

  getWidth: function() {
    return Ember.$(this.element).parent().width();
  },

  getHeight: function() {
    return Ember.$(this.element).parent().height() - 25; // minus topbar height
  },

  initialize: function() {
    if (this.get('autoload') === true) {
      this.connect();
    }
  }.on('didRender'),

  didInsertElement: function() {
    this.startConnection();
  },

  startConnection() {

    if (Ember.isEmpty(this.get('connectionName'))) {
      return ;
    }

    let width = this.getWidth();
    let height = this.getHeight();

    var vidContainer = document.getElementById('vid-container');
    vidContainer.style.display = 'initial';

    var video = document.getElementById('video');
    new PeerConnectionManager(video, 'https://localhost/webrtc');

    let guacSession = this.get('remoteSession').getSession(this.get('connectionName'), width, height);

    this.set('guacamole', guacSession);
    guacSession.then((guacData) => {
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
  },

  actions: {
    retryConnection() {
      this.startConnection();
    }
  }
});
