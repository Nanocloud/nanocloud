/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals JsonApiService */

module.exports = {

  find: function(req, res) {

    if (req.allParams()['me'] === "true") {
      var me = JsonApiService.serialize('users', req.user);

      return res.send(me);
    }

    return JsonApiService.findRecords(req, res);
  }
};
