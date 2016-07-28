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

const http = require("http");
const fs = require("fs");

module.exports = {

  exec: function(hostname, cmd, stdin, callback) {
    let data = {
      "command": cmd,
      "stdin": stdin
    };

    let options = {
      host: hostname,
      path: '/exec',
      port: '9090',
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    };

    let req = http.request(options, (response) => {
      response.on('data', (data) => {
        callback(JSON.parse(data));
      });
    });

    req.write(JSON.stringify(data));
    req.end();
  },

  files: function(hostname, filename, path, next) {
    let options = {
      host: hostname,
      path: "/files?path=" + path,
      port: '9090',
      method: 'GET'
    };

    let req = http.request(options, (response) => {
      response.on('data', (data) => {
        next(JSON.parse(data));
      });
    });
    req.end();
  },

  download: function(hostname, path, callback) {
    let options = {
      host: hostname,
      path: "/files?path=" + encodeURI(path),
      port: '9090',
      method: 'GET'
    };

    let req = http.request(options, (response) => {
      callback(response);
    });
    req.end();
  },

  upload: function(storage, file, callback) {
    let options = {
      host: storage.hostname,
      path: "/upload?filename=" + encodeURI(file.filename) + "&username=" + storage.username,
      port: 9090,
      method: 'POST'
    };

    let readableStream = fs.createReadStream(file.fd);
    readableStream.pipe(http.request(options, callback));
  }
};
