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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * isTrustedClient policy
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */

/* globals Client */

module.exports = function(req, res, next) {

  var grantType = req.param('grant_type');
  if(!grantType){
    return res.send(400, 'missing grant_type parameter');
  } else {
    // Handle password and authorization code grant type
    if(grantType === 'password'){
      // Make sure client_id is provided

      var clientId = req.headers["authorization"];
      if(!clientId){
        return res.send(400, 'missing client_id parameter');
      }

      clientId = new Buffer(clientId.split(' ')[1], 'base64').toString('ascii').split(':')[0];
      if(!clientId){
        return res.send(400, 'invalid client_id parameter');
      } else {
        // Make sure client is trusted
        Client.findOne({clientId: clientId}, function(err, client){
          if(err){
            return res.send(500, err.message);
          } else {
            if(!client){
              return res.send(404, "Client with client id "+ clientId + " not found");
            }

            return next();
          }
        });
      }
    } else if(grantType === 'authorization_code'){
      return next();
    } else if(grantType === 'refresh_token'){
      return next();
    }
  }

};
