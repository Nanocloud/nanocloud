/**
 * AppController
 *
 * @description :: Server-side logic for managing Apps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const fs = require('fs');
const url = require('url');
const guessType = require("guess-content-type");

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

    var file = "";
    if (req.url === "/") {
      file = "index.html";
      res.set('Content-Type', 'text/html; charset=utf-8');
    } else {
      file = url.parse(req.url).pathname;
      res.set('Content-Type', guessType(file));
    }

    var emberApp = __dirname + '/../../assets/dist/' + file;
    fs.stat(emberApp, function (err) {
      if (err) {
        return res.notFound('The requested file does not exist.');
      }

      return fs.createReadStream(emberApp).pipe(res);
    });
  }
};
