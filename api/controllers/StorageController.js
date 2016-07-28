/**
 * UploadController
 *
 * @description :: Server-side logic for managing uploads
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals AccessToken */
/* globals PlazaService */
/* globals Storage */
/* globals StorageService */

const sha1 = require("sha1");

module.exports = {

  upload: function(req, res) {
    let user = req.user;

    StorageService.findOrCreate(user, (err, storage) => {
      let filename = req.query["filename"];

      req.file(filename).upload({
        maxBytes: 0,
      }, function (err, uploadedFiles) {
        if (err) {
          return res.negotiate(err);
        }

        // If no files were uploaded, respond with an error.
        if (uploadedFiles.length === 0){
          return res.badRequest('No file was uploaded');
        }

        PlazaService.upload(
          storage,
          uploadedFiles[0],
          (_, data) => {
            res.send("Upload successful : " + data);
          });
      });
    });
  },

  files: function(req, res) {
    let user = req.user;

    StorageService.findOrCreate(user, (err, storage) => {
      PlazaService.files(storage.hostname, "", "/home/" + storage.username, (files) => {
        res.send(files);
      });
    });
  },

  download: function(req, res) {
    let filename = req.query["filename"];
    let downloadToken = req.query["token"];

    AccessToken.findById(downloadToken.split(":")[0], (err, accessTokens) => {
      let accessToken = accessTokens[0];

      Storage.findOne({user: accessToken.userId}, (err, storage) => {
        PlazaService.download(
          storage.hostname,
          "/home/" + storage.username + "/" + filename,
          (dataStream) => {
            dataStream.pipe(res.attachment(filename));
          });
      });
    });
  },

  token: function(req, res) {
    let user = req.user;
    let filename = req.query["filename"];

    let timestamp = Date.now() / 1000;
    let timeStone = timestamp + (3600 - timestamp % 3600);

    AccessToken.findOne({userId: user.id}, (err, accessToken) => {
      res.send(200, {
        token: accessToken.id + ":" + sha1(accessToken.token + ":" + filename + ":" + timeStone)
      });
    });
  }
};
