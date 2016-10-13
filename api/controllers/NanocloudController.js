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
 *
 * NanocloudController
 *
 * @description :: Server-side logic for managing Apps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* global JsonApiService */

const fs = require('fs');
const url = require('url');
const guessType = require('guess-content-type');
const path = require('path');

module.exports = {

  /**
   * `AppController.serve()`
   * Serves your Ember App directly from the assets/index.html
   *
   * Add some custom code before delivering the app if you want
   * You could add some analytics, or use this to serve different
   * ember apps to differen people.
   * That can be useful for limited feature roll-out or A/B Testing, etc.
   *
   */
  serve: function (req, res) {

    var file = '';
    if (req.url === '/') {
      file = 'index.html';
      res.set('Content-Type', 'text/html; charset=utf-8');
    } else {
      file = url.parse(req.url).pathname;
      res.set('Content-Type', guessType(file));
    }

    var emberApp = path.join(__dirname, '/../../assets/dist/', file);
    fs.stat(emberApp, function (err) {
      if (err) {
        return res.notFound('The requested file does not exist.');
      }

      return fs.createReadStream(emberApp).pipe(res);
    });
  },

  update: function(req, res) {
    return JsonApiService.updateMethod(req, res);
  },

  webrtc: function(req, res) {

    let machineId = req.allParams()['machine-id'];

    Machine.findOne(machineId)
      .then((machine) => {

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const spawn = require('child_process').spawn;
            const ls = spawn('curl', ['http://52.28.172.217:8888/webrtc', '--data', req.body.sdp]);
            let message = '';
            let error = '';

            ls.stdout.on('data', (data) => {
              message += data;
            });

            ls.stderr.on('data', (data) => {
              error += data;
            });

            ls.on('close', (code) => {
              return (code === 0) ? resolve(message) : reject(error);
            });
          }, 2000);
        });
      })
      .then((response) => {
        return res.send(200, response);
      })
      .catch(res.negotiate);
  }
};
