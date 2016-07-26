/**
 * PendingUserController
 *
 * @description :: Server-side logic for managing pendingusers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  create: function(req, res) {
    var nodemailer  = require('nodemailer');
    var uuid = require('node-uuid');
    var host        = 'http://127.0.0.1';
    var user        = req.body.data.attributes;
    user.id = uuid.v4();
    var transporter = nodemailer.createTransport('smtps://postmaster%40mg.nanocloud.com:NObArwDhaHfq@smtp.mailgun.org');   
    var mailOptions = {
      from: '"Nanocloud" <postmaster@nanocloud.com>', // sender address
      to: user.email, // list of receivers seperated by a comma
      subject: 'Nanocloud - Verify your email address', // Subject line
      html: 'Hello ' + user["first-name"] + ' ' + user["last-name"] + ',<br> please verify your email address by clicking this link: '+
        '<a href="'+host+'/#/activate/'+user.id+'">Activate my account</a>' // html body

    };

    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return console.log(error);
      }
      console.log('Message sent: ' + info.response);

      PendingUser.create(JsonApiService.deserialize(user))
      .then(() => {
        return res.json(JsonApiService.serialize("pendinguser", []));
      })
      .catch(() => {
        return res.send(500, "Could not sign up");
      });
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
