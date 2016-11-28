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

/* globals RTCPeerConnection, RTCSessionDescription */

// In order to know if data is received because of a 'getClipboard' action
var fetchClipboard = false;

let ClipboardManager  = function(get, set, rtcChannel) {
  let element = document.getElementById('VDIClipboard');
  this._element = get;
  this._rtcChannel = rtcChannel;

  var getevent = function(event) {
    event.preventDefault();
    rtcChannel.send('G');
    fetchClipboard = true;
  };
  var setevent = function(event) {
    event.preventDefault();
    rtcChannel.send('S' + element.value);
  };

  get.addEventListener('click', getevent);
  set.addEventListener('change', setevent);
};

let KeyboardManager  = function(element, rtcChannel) {
  this._element = element;
  this._rtcChannel = rtcChannel;

  var keyevent = function(event) {
    event.preventDefault();
    rtcChannel.send(((event.type === 'keydown') ? 'D':'U') + String.fromCharCode(event.keyCode));
  };

  element.addEventListener('keydown', keyevent);
  element.addEventListener('keyup', keyevent);
};

let MouseManager = function(element, rtcChannel) {
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

var PeerConnectionManager = function(videoElement, serverAddress, access_token) {
  this._videoElement = videoElement;
  this._serverAddress = serverAddress;
  this._access_token = access_token;

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

  var countLoop = 0;
  var fileContent = [];
  dataChannel.onmessage = function(message) {
    // If user has clicked on 'clipboard' button just before
    if (fetchClipboard === true) {
      fetchClipboard = false;
      let element = document.getElementById('VDIClipboard');
      element.value = message.data;
    } else { // PDF printing
      fileContent.push(message.data);
      setTimeout(() => {
        if (countLoop++ > 0) {return;}
        let filename = 'document.pdf';
        let blob = new Blob([...fileContent], {type: 'application/pdf'});

        if (window.navigator.msSaveOrOpenBlob) {
          window.navigator.msSaveBlob(blob, filename);
        } else {
          var elem = window.document.createElement('a');
          elem.href = window.URL.createObjectURL(blob);
          elem.download = filename;
          document.body.appendChild(elem);
          elem.click();
          document.body.removeChild(elem);
        }
      }, 1500);
    }
  };

  peerConnection.createOffer(function(offer) {
    peerConnection.setLocalDescription(offer);
  }, function() {
  }, {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  });
};

// Prevent double input by relying on Guacamole for inputs and disabling inputs on Photon
PeerConnectionManager.prototype._OnDataChannelOpen = function() {
  var mouseManager = new MouseManager(this._videoElement, this._dataChannel);
  //var keyboardManager = new KeyboardManager(document.body, this._dataChannel);
  var clipboardManager = new ClipboardManager(document.getElementById('getCloudClipboard'), document.getElementById('VDIClipboard'), this._dataChannel);
  return [
    mouseManager,
    clipboardManager,
//    keyboardManager
  ];
};

PeerConnectionManager.prototype._OnICECandidate = function(event) {
  var self = this;

  if (event.candidate === null) {
    var sdp = this._peerConnection.localDescription.sdp;

    var req = new XMLHttpRequest();

    req.open('POST', this._serverAddress, true);
    req.setRequestHeader('Authorization', 'Bearer ' + this._access_token);

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

    req.send(JSON.stringify({
      sdp: sdp
    }));
  }
};

PeerConnectionManager.prototype._OnAddStream = function(event) {
  var url = URL.createObjectURL(event.stream);
  this._videoElement.src = url;
};

export default {
  KeyboardManager,
  MouseManager,
  ClipboardManager,
  PeerConnectionManager
};
