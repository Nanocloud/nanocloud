/**
 * PendingUserController
 *
 * @description :: Server-side logic for managing pendingusers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const uuid = require('node-uuid');

module.exports = {

  create: function(req, res) {

    ConfigService.get(
      'host'
    )
    .then((configuration) => {
      var host = configuration.host;
      var user = req.body.data.attributes;
      user.id = uuid.v4();
      user["isAdmin"] = false;
      var to =  user.email;
      var subject = 'Nanocloud - Verify your email address';
      var message = 'Hello ' + user["first-name"] + ' ' + user["last-name"] + ',<br> please verify your email address by clicking this link: '+
          '<a href="'+configuration.host+'/#/activate/'+user.id+'">Activate my account</a>';

      EmailService.sendMail(to, subject, message)
        .then(() => {
          return PendingUser.create(JsonApiService.deserialize(user))
        })
        .then((created_user) => {
          res.status(201);
          return res.json(JsonApiService.serialize("PendingUser", created_user));
        })
        .catch(() => {
          return res.send(500, "Could not signup");
        });
    })
    .catch(() => {
      return res.send(500, "Unable to retrieve configuration variable");
    });
  },

  update: function(req, res) {
    let pendingUserID = req.params.id;
    PendingUser.findOne({
      "id": pendingUserID
    })
    .then((user) => {
      if (!user) {
        return res.notFound('No user has been found');
      }
      User.create(user)
      .then(() => {
        return PendingUser.destroy({
          "id": pendingUserID
        });
      })
      .then(() => {
        return res.json(user);
      });
    })
    .catch((error) => {
      return res.notFound('An error has occured while retrieving user');
    });
  } 
};