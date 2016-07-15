/**
 * AppController
 *
 * @description :: Server-side logic for managing Apps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var fs = require('fs');
const url = require('url');

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

    var file = (req.url === "/") ? "index.html" : url.parse(req.url).pathname;

    var emberApp = __dirname + '/../../assets/' + file;
    fs.exists(emberApp, function (exists) {
      if (!exists) {
        return res.notFound('The requested file does not exist.');
      }

      return fs.createReadStream(emberApp).pipe(res);
    });
  }
};
