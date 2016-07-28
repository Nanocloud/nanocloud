/* globals AccessToken */

const sha1 = require("sha1");

module.exports = function(req, res, next) {
  let filename = req.query["filename"];
  let downloadToken = req.query["token"];

  let timestamp = Date.now() / 1000;
  let timeStone = timestamp + (3600 - timestamp % 3600);

  AccessToken.findById(downloadToken.split(":")[0], (err, accessTokens) => {
    let accessToken = accessTokens[0];
    let expectedToken = accessToken.id + ":" + sha1(accessToken.token + ":" + filename + ":" + timeStone);

    if (expectedToken !== downloadToken) {
      next(new Error("Wrong download token"));
    }
    next();
  });
};
