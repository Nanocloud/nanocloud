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

/**
 * StorageController
 *
 * @description :: Server-side logic for managing uploads
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals AccessToken, PlazaService, Storage, StorageService, MachineService */

const Promise = require('bluebird');

module.exports = {

  /**
   * Upload a file in user's storage
   *
   * @method upload
   * @public true
   */
  upload: function(req, res) {
    let user = req.user;
    let filename = req.query.filename;

    StorageService.findOrCreate(user)
      .then((storage) => {
        return StorageService.checkUploadLimit(storage, parseInt(req.headers['content-length'], 10))
          .then(() => {
            return new Promise(function(resolve, reject) {
              req.file(filename).upload({
                maxBytes: 0
              }, function(error, uploadedFiles) {
                return error ? reject(error) : resolve(uploadedFiles);
              });
            });
          })
          .then((uploadedFiles) => {
            // If no files were uploaded, respond with an error.
            if (uploadedFiles.length === 0){
              return res.badRequest('No file was uploaded');
            }
            return PlazaService.upload(storage, uploadedFiles[0]);
          });
      })
      .then((response) => {
        return res.ok(response.body);
      })
      .catch((err) => {
        if (err.statusCode === 403) {
          return res.forbidden(err.message);
        }
        return res.negotiate(err);
      });
  },

  /**
   * files get a list of files
   *
   * @method files
   * @public true
   */
  files: function(req, res) {

    let getFiles;

    if (req.allParams().machines === 'true') {
      getFiles = MachineService.getMachineForUser(req.user)
        .then((machine) => {
          return PlazaService.files({
            hostname: machine.ip,
            port: machine.plazaport
          }, req.allParams().path || 'C:\\');
        });
    } else {
      getFiles = StorageService.findOrCreate(req.user)
        .then((storage) => {
          return PlazaService.files(storage, '/home/' + storage.username)
            .then((files) => {
              return StorageService.storageSize(storage)
                .then((size) => {
                  files.meta = {
                    storageSize: size
                  };
                  return files;
                });
            });
        });
    }
    getFiles.then((files) => {
      return res.send(files);
    })
      .catch(res.negotiate);
  },

  /**
   * download a file from storage
   *
   * @method download
   * @public true
   */
  download: function(req, res) {
    let filename = req.query.filename;
    let downloadToken = req.query.token;

    AccessToken.findOne({
      id: downloadToken.split(':')[0]
    })
      .then((accessToken) => {
        return Storage.findOne({
          user: accessToken.userId
        });
      })
      .then((storage) => {
        return PlazaService.download(storage, '/home/' + storage.username + '/' + filename);
      })
      .then((dataStream) => {
        return dataStream.pipe(res.attachment(filename));
      })
      .catch((err) => {
        return res.negotiate(err);
      });
  },

  /**
   * token create a one hour token for download
   *
   * @method token
   * @public true
   */
  token: function(req, res) {
    let user = req.user;
    let filename = req.query.filename;

    AccessToken.findOne({userId: user.id}, (err, accessToken) => {
      if (err !== null) {
        return res.negotiate(err);
      }
      return res.send(200, {
        token: StorageService.createToken(accessToken, filename)
      });
    });
  },

  /**
   * update is forbidden for everyone
   *
   * @method update
   * @public true
   */
  update: function(req, res) {
    return res.forbidden();
  },
};
