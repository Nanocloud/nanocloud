/**
 * Nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud.
 *
 * Nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

/* globals sails, RefreshToken, AccessToken, User */

var oauth2orize         = require('oauth2orize'),
  passport            = require('passport'),
  trustedClientPolicy = require('../api/policies/isTrustedClient.js');

// Create OAuth 2.0 server
var server = oauth2orize.createServer();

// Exchange username & password for access token.
server.exchange(oauth2orize.exchange.password(function(user, username, password, scope, done) {

  User.findOne({
    email: username,
    or: [
      { expirationDate: { '>' : Math.floor(new Date() / 1000)  } },
      { expirationDate: null },
      { expirationDate: 0 }
    ]
  }, function(err, user) {

    if (err) {
      done(err);
    }
    if (!user) {
      return done(user);
    }

    // delete reset password tokens
    global['Reset-password'].destroy({
      email: user.email
    });
    RefreshToken.create({
      userId: user.id
    }, function(err, refreshToken){

      if (err) {
        return done(err);
      } else {
        return AccessToken.create({ userId: user.id }, function(err, accessToken){
          if(err) {
            return done(err);
          } else {
            return done(null, accessToken.token, refreshToken.token, { expires_in: sails.config.oauth.tokenLife });
          }
        });
      }
    });
  });
}));

// Exchange refreshToken for access token.
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {

  RefreshToken.findOne({ token: refreshToken }, function(err, token) {

    if (err) { return done(err); }
    if (!token) { return done(null, false); }

    User.findOne({id: token.userId}, function(err, user) {

      if (err) { return done(err); }
      if (!user) { return done(null, false); }

      // Remove Refresh and Access tokens and create new ones
      RefreshToken.destroy({ id: token.id }, function (err) {
        if (err) {
          return done(err);
        } else {
          RefreshToken.create({ userId: user.id }, function(err, refreshToken){
            if(err){
              return done(err);
            } else {
              AccessToken.create({ userId: user.id }, function(err, accessToken){
                if(err) {
                  return done(err);
                } else {
                  done(null, accessToken.token, refreshToken.token, { expires_in: sails.config.oauth.tokenLife });
                }
              });
            }
          });
        }
      });
    });
  });
}));

module.exports = {
  http: {
    customMiddleware: function(app){

      // Initialize passport
      app.use(passport.initialize());

      app.post('/oauth/token',
               trustedClientPolicy,
               function(req, res, next) { // If grant_type is invalid, return error

                 if (req.body.grant_type !== 'password' && req.body.grant_type !== 'refresh_token') {
                   return res.json({
                     error: 'invalid_request',
                     error_description: 'grant_type is missing'
                   });
                 }

                 next();
               },
               function(req, res, next) {

                 res.set('Content-Type', 'application/json;charset=UTF-8');

                 // If request is a refresh_token renewal, let's fork the flow
                 if (req.body.grant_type === 'refresh_token') {
                   var tokenFunction = server.token();

                   return tokenFunction(req, res, (err) => {
                     if (err) {
                       return next(err);
                     }
                   });
                 }
                 return next();

               },
               function(req, res, next) {
                 passport.authenticate('local', function(err, user) {

                   if (err) {
                     return next(err);
                   }

                   if (!user) {

                     res.status(400);
                     return res.json({
                       error: 'access_denied',
                       error_description: 'Invalid User Credentials'
                     });
                   }

                   next(null, user);
                 })(req, res, next);
               },
               server.token(),
               server.errorHandler()
              );

      app.post('/oauth/revoke',
        function(req, res) {
          if (req.body.token_type_hint === 'access_token') {
            AccessToken.destroy({
              token: req.body.token
            })
              .then(() => {
                return res.send(200);
              })
              .catch(() => {
                return res.badRequest();
              });
          } else if (req.body.token_type_hint === 'refresh_token') {
            RefreshToken.destroy({
              token: req.body.token
            })
              .then(() => {
                return res.send(200);
              })
              .catch(() => {
                return res.badRequest();
              });
          } else {
            return res.badRequest();
          }
        }
      );
    }
  }
};
