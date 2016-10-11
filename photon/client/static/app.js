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
/* globals PeerConnectionManager */


function main_rtc(server_address) {
  var vidContainer = document.getElementById('vid-container');
  vidContainer.style.display = 'initial';
  vidContainer.addEventListener('dblclick', function() {
    if (vidContainer.mozRequestFullScreen) {
      vidContainer.mozRequestFullScreen();
    } else if (vidContainer.webkitRequestFullscreen) {
      vidContainer.webkitRequestFullscreen();
    }
  }, false);

  var video = document.getElementById('video');
  new PeerConnectionManager(video, 'http://' + server_address + '/webrtc');
}

main_rtc('localhost:8080');
