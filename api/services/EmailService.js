const nodemailer  = require('nodemailer');

module.exports = {

  _initialized: false,

  sendMail: function(to, subject, message) {

    return ConfigService.get('smtpServerHost', 'smtpLogin', 'smtpPassword', 'smtpSendFrom')
      .then((res) => {
        var smtpConfig = {
          host: "smtp.mailgun.org",
          auth: {
            user: res.smtpLogin,
            pass: res.smtpPassword
          }
        };
        var transporter = nodemailer.createTransport(smtpConfig);   
        var mailOptions = {
          from: '"Nanocloud" <' + res.smtpSendFrom + '>', // sender address
          to: to, // list of receivers seperated by a comma
          subject: subject, // Subject line
          html: message
        };
        return transporter.sendMail(mailOptions);
      });
  }
};
