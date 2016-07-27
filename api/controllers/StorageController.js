/**
 * UploadController
 *
 * @description :: Server-side logic for managing uploads
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals JsonApiService */

module.exports = {

  upload: function(req, res) {
    let user = req.user;

    StorageService.findOrCreate(user, (err, storage) => {
      let filename = req.query["filename"];

      req.file(filename).upload(function (err, uploadedFiles) {
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
            (err, data) => {
              res.send("Upload successful");
            });
        });
    });
  },

  files: function(req, res) {
    PlazaService.files("localhost", "", "/home/qleblqnc/", (files) => {
      res.send(files);
    })
  }
};

