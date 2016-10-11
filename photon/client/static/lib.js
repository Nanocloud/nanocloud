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

'use strict';

/* jshint browser: true */
/* globals RTCPeerConnection, RTCSessionDescription */

/*
 * KeyboardManager
 */
var KeyboardManager;

(function() {
  KeyboardManager = function(element, rtcChannel) {
    this._element = element;
    this._rtcChannel = rtcChannel;

    var keyevent = function(event) {
      event.preventDefault();
      rtcChannel.send(((event.type === 'keydown') ? 'D':'U') + String.fromCharCode(event.keyCode));
    };

    element.addEventListener('keydown', keyevent);
    element.addEventListener('keyup', keyevent);
  };
})();

/*
 * MouseManager
 */
var MouseManager;

(function() {
  MouseManager = function(element, rtcChannel) {
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
})();


var PeerConnectionManager;

(function() {
  PeerConnectionManager = function(videoElement, serverAddress) {
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
    new MouseManager(this._videoElement, this._dataChannel);
    new KeyboardManager(document.body, this._dataChannel);
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
})();
