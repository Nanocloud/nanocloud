/**
 * Nanocloud, a comprehensive platform to turn any application into a cloud
 * solution.
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
