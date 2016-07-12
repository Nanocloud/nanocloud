/**
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
