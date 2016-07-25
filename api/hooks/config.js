const ConfigService = require('../services/ConfigService');

module.exports = function(sails) {
  return {
    initialize(done) {
      sails.after('hook:orm:loaded', () => {
        return ConfigService.init()
        .then(() => {
          sails.emit('hook:config:loaded');
          done();
        })
        .catch((err) => {
          if (err) {
            throw new Error('Fail to initialize config.');
          }
        });
      });
    }
  };
};
