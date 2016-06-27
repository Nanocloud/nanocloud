/*
 * If request concerns the API (a.k.a target /api/*), we shall find the user
 * associated with the given token (if any).
 * This user will then be stored in *req.user* for future use.
 */
module.exports = function(req, res, next) {

  var originalUrl = req.originalUrl;
  var tokenizedOriginalUrl = originalUrl.split('/');

  if (tokenizedOriginalUrl[1] !== 'api'){
    return next(null);
  }

  if (typeof req.headers['authorization'] === "undefined") {
    return next('No authorization token provided');
  }

  var token = req.headers['authorization'].split(' ')[1];

  // TODO Link token an user together to have only one query
  AccessToken.findOne({
    token: token
  }, function(err, token) {

    if (err) next(err);

    if (token === null) next('Invalid token');

    var userId = token.userId;

    User.findOne({
      id: userId
    }, function(err, user) {

      if (err) next(err);

      if (user === null) next('No user associated with this token');

      req.user = user;
      return next(null);
    });
  });
};
