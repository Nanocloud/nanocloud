var passport = require('passport');

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

  return passport.authenticate('bearer', function(err, user, info) {

    if ((err) || (!user)) {
      return res.send(401);
    }

    delete req.query.access_token;
    req.user = user;

    return next(null);
  })(req, res);
};
