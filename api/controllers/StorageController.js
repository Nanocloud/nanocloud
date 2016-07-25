/**
 * UploadController
 *
 * @description :: Server-side logic for managing uploads
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals JsonApiService */

module.exports = {

  upload: function(req, res) {
    let filename = req.query["filename"];
    let user = JsonApiService.serialize('users', req.user);

    console.log(StorageService.findOrCreate(user));
    console.log("TODO: forward file to http://localhost:9090/upload?username=" + user.username + "&filename=" +  encodeURIComponent(filename));
    return res.send("upload endpoint not implemented yet");
  },
};

