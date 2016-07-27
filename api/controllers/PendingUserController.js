/**
 * PendingUserController
 *
 * @description :: Server-side logic for managing pendingusers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const uuid = require('node-uuid');

module.exports = {

  create: function(req, res) {

    var host = "http://127.0.0.1:4200";
    var user = req.body.data.attributes;
    user.id = uuid.v4();
    user["isAdmin"] = false;
    var to =  user.email;
    var subject = 'Nanocloud - Verify your email address';
    var message = 'Hello ' + user["first-name"] + ' ' + user["last-name"] + ',<br> please verify your email address by clicking this link: '+
        '<a href="'+host+'/#/activate/'+user.id+'">Activate my account</a>';

    EmailService.sendMail(to, subject, message)
      .then(() => {
        PendingUser.create(JsonApiService.deserialize(user))
          .then((created_user) => {
            res.status(201);
            return res.json(JsonApiService.serialize("PendingUser", created_user.toJSON()));
          })
        .catch(() => {
          return res.send(500, "Could not sign up");
        });
      })
      .catch(() => {
          return res.send(500, "Could not send activation email");
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
      sails.log('Found "%s"', user.firstName);

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
