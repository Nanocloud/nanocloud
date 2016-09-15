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

const http = require('http');
const fs = require('fs');
const request = require('request-promise');
const Promise = require('bluebird');

module.exports = {

  /**
   * exec
   *
   * Exec a windwows command with Plaza
   *
   * @param {String} storage hostname
   * @param {string} listening storage port
   * @param {Object} query description:
   * {
   *   username: '', // User's name the command should be executed by
   *   wait: true || false, // whether the call should be blocking or not
   *   hideWindow: true || false, // whether the application should be run in background or not
   *   command: array(). // argument list to execute. Behaves like argv
   * }
   * @return {Promise} Request to Plaza
   */
  exec: function(hostname, port, query) {
    let options = {
      url: 'http://' + hostname + ':' + port + '/exec',
      json: true,
      body: query,
      method: 'POST'
    };

    return request(options);
  },

  /**
   * files
   *
   * Ask a list of files
   *
   * @param {Object} storage used by user
   * @param {string} path where we ask files
   * @return {Promise} Request to Plaza
   */
  files: function(storage, path) {
    let options = {
      url: 'http://' + storage.hostname + ':' + storage.port + '/files?path=' + encodeURI(path),
      method: 'GET'
    };

    return request(options).then((result) => {
      return JSON.parse(result);
    });
  },

  /**
   * rename
   *
   * Ask for a file to be renamed
   *
   * @param {Object} storage used by user
   * @param {string} oldpath the current file location
   * @param {string} newpath the new desired path
   * @return {Promise} Request to Plaza
   */
  rename: function(storage, oldpath, newpath) {
    let options = {
      url: 'http://' + storage.hostname + ':' + storage.port + '/files?username=' + encodeURI(storage.username) + '&filename=' + oldpath + '&newfilename=' + newpath,
      method: 'PATCH'
    };

    return request(options);
  },

  /**
   * remove
   *
   * Ask for a file to be removed
   *
   * @param {Object} storage used by user
   * @param {string} path file to remove
   * @return {Promise} Request to Plaza
   */
  remove: function(storage, path) {
    let options = {
      url: 'http://' + storage.hostname + ':' + storage.port + '/files?username=' + encodeURI(storage.username) + '&filename=' + path,
      method: 'DELETE'
    };

    return request(options);
  },

  /**
   * createDirectory
   *
   * Ask for a directory to be created
   *
   * @param {Object} storage used by user
   * @param {string} path directory's path
   * @return {Promise} Request to Plaza
   */
  createDirectory: function(storage, path) {
    let options = {
      url: 'http://' + storage.hostname + ':' + storage.port + '/directory?username=' + encodeURI(storage.username) + '&filename=' + path,
      method: 'POST'
    };

    return request(options);
  },

  /**
   * download
   *
   * Ask to download a file
   *
   * @param {Object} storage used by user
   * @param {string} path of file
   * @return {Promise} Request to Plaza
   */
  download: function(storage, path) {
    let options = {
      host: storage.hostname,
      path: '/files?path=' + encodeURI(path),
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

  /**
   * upload
   *
   * Ask to upload a file
   *
   * @param {Object} storage used by user
   * @param {Object} Object of the new file
   * @return {Promise} Request to Plaza
   */
  upload: function(storage, file) {
    let options = {
      host: storage.hostname,
      path: '/upload?filename=' + encodeURI(file.filename) + '&username=' + storage.username,
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
