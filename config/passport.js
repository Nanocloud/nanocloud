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

/* globals User, AccessToken, sails, ConfigService */

const Promise = require('bluebird'),
  bcrypt = require('bcryptjs'),
  moment = require('moment'),
  passport = require('passport'),
  BearerStrategy = require('passport-http-bearer').Strategy,
  LocalStrategy = require('passport-local').Strategy,
  activedirectory = require('activedirectory');

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
          let authLdap = function(ldapConfig, username, password){
            let config = { url: ldapConfig.url,
              baseDN: ldapConfig.baseDn,
              username: username,
              password: password };
            let ad = new activedirectory(config);

            // Trying to authenticate user in LDAP
            return new Promise(function(resolve, reject) {
              ad.authenticate(config.username, config.password, function(err, auth) {
                if (err) {
                  return reject(err);
                } else if (auth) { // User found in LDAP
                  ad.opts.bindDN = username;
                  ad.opts.bindCredentials = password;
                  ad.findUser(username, function(err, user) {
                    if (err || !user) {
                      return reject(JSON.stringify(err));
                    }

                    let ldapUser = {
                      email: username,
                      password: null, // we use the ldap password to authenticate ldap users
                      ldapPassword: password,
                      firstName: user.givenName,
                      lastName: user.sn,
                      ldapUser: true // flag them
                    };
                    return setLdapUser(ldapUser)
                      .then((res, err) => {
                        if (err) {
                          return reject(err);
                        }
                        return resolve(res);
                      });
                  });
                } else { // User not found neither in databse nor in LDAP
                  return reject(null);
                }
              });
            });
          };

          let setLdapUser = function(ldapUser){
            return User.findOne({email: ldapUser.email})
              .then((databaseUser) => {
                if (!databaseUser) {
                  // First connection
                  // We create a new account for him
                  return User.create(ldapUser)
                    .then((user) => {
                      if (!user) {
                        throw new Error('Can not create user');
                      } else if (user.ldapUser !== true) {
                        return Promise.resolve(user); // Database's user
                      }
                      return ConfigService.get('defaultGroupLdap')
                        .then((config) => {
                          return new Promise(function(resolve, reject) {
                            if (!config.defaultGroupLdap || config.defaultGroupLdap === 'false') {
                              return resolve(user);
                            }
                            user.groups.add(config.defaultGroupLdap);
                            user.save((err) => {
                              if (err) {
                                return reject(err);
                              }
                              return resolve(user);
                            });
                          });
                        });
                    })
                    .then((user, err) => {
                      if (err || !user) {
                        return Promise.reject(err);
                      }
                      return Promise.resolve(user);
                    });
                } else if (databaseUser.firstName !== ldapUser.givenName
                || databaseUser.lastName !== ldapUser.sn
                || databaseUser.ldapPassword !== ldapUser.ldapPassword) {
                  // At least it's the second connection
                  // Update user's first name and last name because they're
                  // different from those which are in database
                  return User.update({
                    email: username
                  }, ldapUser)
                    .then((updatedUser) => {
                      return Promise.resolve(updatedUser);
                    });
                }
                // At least it's the second connection
                // No information has changed from the last connection
                return Promise.resolve(databaseUser);
              });
          };

          ConfigService.get('ldapActivated', 'ldapUrl', 'ldapBaseDn')
            .then((config) => {
              var ldapActivated = config.ldapActivated;
              var ldapConfig = {
                url: config.ldapUrl,
                baseDn: config.ldapBaseDn
              };

              User.findOne({
                email: username
              }).exec(function (err, user) {
                if (err) {
                  return done(err);
                } else if (!user || (user.ldapUser === true && ldapActivated === true)) {
                  // Can't retreive account in the DB with the specified email
                  // Is LDAP activated ? if so checking into LDAP if user exists
                  if (ldapActivated === false) {
                    return done(null, null);
                  } else {
                    return authLdap(ldapConfig, username, password)
                      .then((user) => {
                        return done(null, user);
                      })
                      .catch((err) => {
                        return done(err, null);
                      });
                  }
                }

                bcrypt.compare(password, user.hashedPassword, function(err, res){
                  if(err){
                    return done(err);
                  } else {
                    if (!res) {
                      return done({
                        error: 'access_denied',
                        error_description: 'Invalid user credentials',
                        status: 400
                      });
                    } else if (user.expirationDate < Math.floor(new Date() / 1000)
                      && (user.expirationDate)) {
                      return done({
                        error: 'access_denied',
                        error_description: 'This account is expired',
                        status: 400
                      });
                    } else {
                      return done(null, user);
                    }
                  }
                });
              });
            });
        });
    }
  ));

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
      .populate('groups')
      .exec(function (err, user) {
        User.findOne({
          id: token.userId
        },done(err,user,info));
      });
    });
  }
));
