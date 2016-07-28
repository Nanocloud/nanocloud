const nodemailer  = require('nodemailer');
const stubTransport = require('nodemailer-stub-transport');

function sendMail(to, subject, message) {

  return ConfigService.get('testSendMail', 'smtpServerHost', 'smtpServerPort', 'smtpLogin', 'smtpPassword', 'smtpSendFrom')
    .then((res) => {
      var smtpConfig = {
        host: res.smtpServerHost,
        port: res.smtpServerPort,
        auth: {
          user: res.smtpLogin,
          pass: res.smtpPassword
        }
      };

      if (res.testSendMail) {
        smtpConfig = stubTransport();
      }

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

module.exports = { sendMail, init };
