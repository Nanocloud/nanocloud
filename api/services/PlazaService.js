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
const request = require("request-promise");
const Promise = require("bluebird");

module.exports = {

  exec: function(hostname, port, cmd, stdin) {
    let options = {
      url: "http://" + hostname + ":" + port + "/exec",
      headers: {
        'Content-Type': 'application/json'
      },
      json: true,
      body: {
        "command": cmd,
        "stdin": stdin
      },
      method: 'POST'
    };

    return request(options);
  },

  files: function(storage, filename, path) {
    let options = {
      url: "http://" + storage.hostname + ":" + storage.port + "/files?path=" + encodeURI(path),
      method: 'GET'
    };

    return request(options).then((result) => {
      return JSON.parse(result);
    });
  },

  download: function(storage, path) {
    let options = {
      host: storage.hostname,
      path: "/files?path=" + encodeURI(path),
      port: storage.port,
      method: 'GET',
    };

    return new Promise(function(resolve, reject) {
      let req = http.request(options, function(response) {
        if (response.statusCode !== 200) {
          return reject(response);
        }
        return resolve(response);
      });
      req.end();
    });
  },

  upload: function(storage, file) {
    let options = {
      host: storage.hostname,
      path: "/upload?filename=" + encodeURI(file.filename) + "&username=" + storage.username,
      port: storage.port,
      method: 'POST'
    };

    return new Promise(function(resolve, reject) {
      let readableStream = fs.createReadStream(file.fd);
      readableStream.pipe(http.request(options, (response) => {
        if (response.statusCode !== 200) {
          return reject(response);
        }
        return resolve(response);
      }));
    });
  }
};
