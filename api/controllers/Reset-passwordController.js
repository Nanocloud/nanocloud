/**
 * Reset-passwordController
 *
 * @description :: Server-side logic for managing resetpasswords
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const nodemailer  = require('nodemailer');
const uuid        = require('node-uuid');
const bcrypt      = require("bcryptjs");

module.exports = {
  create: function(req, res) {
    const ResetPassword = global['Reset-password'];

    var token;
    var user = req.body.data.attributes;

    // find user via his email address
    User.findOne({
      "email": user.email
    })
    // generate new reset password token
    .then((user) => {
      token = uuid.v4();

      return ResetPassword.create({
        "email": user.email,
        "id": token
      });
    })
    .then(() => {
      return ConfigService.get(
        'smtpServerHost', 'smtpLogin', 'smtpPassword', 'smtpSendFrom', 'host'
      );
    })
    // send him reset password link
    .then((conf) => {
      let smtpConfig  = {
        host: conf.smtpServerHost,
        from: conf.smtpSendFrom,
        appHost: conf.host,
        auth: {
          user: conf.smtpLogin,
          pass: conf.smtpPassword
        }
      };

      let host        = smtpConfig.appHost;
      let transporter = nodemailer.createTransport(smtpConfig);

      let mailOptions = {
        from: '"Nanocloud" <'+smtpConfig.from+'>', // sender address
        to: user.email, // list of receivers seperated by a comma
        subject: 'Nanocloud - Reset your password', // Subject line
        html: "Hello,<br>"
          +"We got a request to reset your password.<br>"
          +"<a href='"+host+"/#/reset-password/"+token+"'>"
          +"Reset my password</a><br><br><i>"
          +"If you ignore this message your password won't be changed.</i>"
      };

      // mail sent here
      transporter.sendMail(mailOptions, function(error, info){
        if(error){
          return res.negotiate(error);
        }
        return res.ok({});
      });
    })
    .catch((err) => {
      return res.negotiate(err);
    });
  },

  update: function(req, res) {
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
      return res.ok({});
    })
    .catch((err) => {
      return res.negotiate(err);
    });
  }
};

