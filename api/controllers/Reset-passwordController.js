/**
 * Reset-passwordController
 *
 * @description :: Server-side logic for managing resetpasswords
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  create: function(req, res) {
    const nodemailer  = require('nodemailer');
    const uuid        = require('node-uuid');

    var user = req.body.data.attributes;

    User.findOne({
      "email": user.email
    })
    .then((user) => {
      // generate new reset password token
      user.id = uuid.v4();

      global['Reset-password'].create({ 
        "email": user.email,
        "id": user.id
      })
      .then(() => {
        return ConfigService.get(
            'smtpServerHost', 'smtpLogin', 'smtpPassword', 'smtpSendFrom'
        );
      })
      .then((res) => {
        let smtpConfig = {
          host: res.smtpServerHost,
          auth: {
            user: res.smtpLogin,
            pass: res.smtpPassword,
            from: res.smtpSendFrom
          }
        };
        let host        = 'http://127.0.0.1';
        let transporter = nodemailer.createTransport(
          'smtps://'+smtpConfig.user
          +':'+stmpConfig.pass
          +'@'+smtpConfig.host
        );
        let mailOptions = {
          from: '"Nanocloud" <'+smtpConfig.from+'>', // sender address
          to: user.email, // list of receivers seperated by a comma
          subject: 'Nanocloud - Reset your password', // Subject line
          html: "Hello,<br>"
            +"We got a request to reset your password.<br>"
            +"<a href='"+host+"/#/reset-password/"+user.id+"'>"
            +"Reset my password</a><br><br><i>"
            +"If you ignore this message your password won't be changed.</i>"
        };
        transporter.sendMail(mailOptions, function(error, info){
          if(error){
            return console.log(error);
          }
          res.status(202);
          return res.json(JsonApiService.serialize("Reset-password", []));
        });
      })
      .catch((err) => {
        console.log(err);
        return res.send(500, "Could not create reset password token");
      });
    })
    .catch((err) => {
      console.log('An error has occured while retrieving user');
      return res.send(500, 'An error has occured while retrieving user');
    });
  },

  update: function(req, res) {
    const bcrypt        = require("bcryptjs");
    const ResetPassword = global['Reset-password'];

    var token    = req.params.id;
    var dataReq  = req.body.data.attributes;

    // find user
    ResetPassword.findOne({
      "id": token
    })
    .then((tokenFound) => {
      token = tokenFound;
      return User.findOne({
        "email": token.email
      });
    })
    // update his password
    .then((user) => {
      if (!user) {
        return res.notFound('No user has been found');
      }

      let hash = bcrypt.hashSync(dataReq.password, 10);
      return User.update({
        id: user.id
      }, {
        hashedPassword: hash
      });
    })
    // destroy the reset password token
    .then(() => {
      return ResetPassword.destroy({
        id: token.id
      });
    })
    // return response
    .then(() => {
      res.status(200);
      return res.send(
        JsonApiService.serialize('Reset-password', {})
      );
    })
    .catch((err) => {
      console.log(err);
      return res.send(500, "Invalid token");
    });
  }
};

