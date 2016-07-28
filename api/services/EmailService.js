const nodemailer  = require('nodemailer');
const stubTransport = require('nodemailer-stub-transport');

/**
 * init initializes the EmailService. It will copy the configuration variables
 * found in `config.nanocloud` in the database.
 *
 * @method init
 * @private
 * @param {Function} callback Completion callback
 * @return {Promise[null]}
 */
function init(callback) {
  const config = sails.config.nanocloud;
  let actions = [];

  for (let name in config) {
    if (config.hasOwnProperty(name)) {
      actions.push(set(name, nanocloudConfigValue(name, config[name])));
    }
  }
  return Promise.all(actions).then(callback, callback);
}


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
