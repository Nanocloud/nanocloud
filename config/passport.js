/* globals User, AccessToken */

var bcrypt = require('bcryptjs'),
    moment = require('moment'),
    passport = require('passport'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({id:id}, function (err, user) {
    done(err, user);
  });
});

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(
  new LocalStrategy(

    function (username, password, done) {

      process.nextTick(

        function () {
          User.findOne({
            email: username
          }).exec(function (err, user) {
            if (err) {
              return done(err);
            }

            if (!user) {
              return done(
                null, false, {
                  message: 'Unknown user ' + username
                });
            }

            bcrypt.compare(password, user.hashedPassword, function(err, res){
              if(err){
                return done(err, null);
              } else {
                if (!res) {
                  return done( null, false, { message: 'Invalid password' });
                } else {
                  return done(null, user);
                }
              }
            });
          });
        });
    }));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).  The user must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function(accessToken, done) {

    AccessToken.findOne({token:accessToken}, function(err, token) {
      if (err) { return done(err); }
      if (!token) { return done(null, false); }

      var now = moment().unix();
      var creationDate = moment(token.createdAt).unix();

      if( now - creationDate > sails.config.oauth.tokenLife ) {
        AccessToken.destroy({ token: accessToken }, function (err) {
          if (err) {
            return done(err);
          }

          return done(null, false, { message: 'Token expired' });
        });
      }

      var info = {scope: '*'};
      User.findOne({
        id: token.userId
      })
        .exec(function (err, user) {
          User.findOne({
            id: token.userId
          },done(err,user,info));
        });
    });
  }
));
