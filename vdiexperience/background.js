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

// Listen when a webrequest in *://*/api/apps/* is completed
chrome.webNavigation.onCompleted.addListener(function(res) {

  // Inject agent.js in the page
  chrome.tabs.executeScript(res.tabId, {
    file: 'agent.js'
  });
}, {urlMatches: ['http*://*/#/vdi*']});

chrome.runtime.onConnect.addListener(function(port){
  port.onMessage.addListener(function(msg) {

    // Copy from virtual machine to host
    if (msg.type === 'VDIExperience') {
      var textArea = document.createElement('textarea');
      textArea.value = msg.value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    // Copy from host to virtual machine
    else if (msg.type === 'onfocus') {
      var paste = document.createElement('textarea');
      document.body.appendChild(paste);
      paste.select();
      document.execCommand('paste');
      port.postMessage({type: 'paste', value: paste.value});
      document.body.removeChild(paste);
    }
  });
});
