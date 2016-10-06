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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var port = chrome.runtime.connect();

// Listen messages from nanocloud's frontend
// and send them to extension's background
window.addEventListener('message', function(event) {
  if (event.data.type === 'VDIExperience' ) {
    port.postMessage(event.data);
  } else if (event.data.type === 'onfocus') {
    port.postMessage(event.data);
  } else if (event.data.type === 'check') {
    window.postMessage({type: 'returnCheck', value: 'yes'}, '*');
  }
}, false);

// Listen messages from extension's background,
// paste data in VDI clipboard text area
// and dispatch the change event so that this change is taken into account
port.onMessage.addListener(function(msg) {
  if (msg.type === 'paste') {
    var event = document.createEvent('HTMLEvents');
    event.initEvent('change', true, false);
    var textarea = document.getElementById('VDIClipboard');
    if (textarea) {
      textarea.value = msg.value;
      textarea.dispatchEvent(event);
    }
  }
});

var getUserClipboard = function() {
  window.postMessage({type: 'onfocus'}, '*');
};

window.onfocus = getUserClipboard;
getUserClipboard();
