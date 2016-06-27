/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var JSONAPISerializer = require('json-api-serializer');
var Serializer = new JSONAPISerializer();
var findRecords = require('sails-json-api-blueprints/lib/api/blueprints/find');

module.exports = {

  find: function(req, res) {

    if (req.allParams()['me'] === "true") {
      Serializer.register('users', {
        id: 'id'
      });

      var me = Serializer.serialize('users', req.user);

      return res.send(me);
    }

    return findRecords(req, res);
  }
};
