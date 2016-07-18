const driver = require('../drivers/' + process.env.IAAS + '/driver');

module.exports = {

  _initialized: false,

  init: function(callback) {

    return driver.init((err) => {

      if (err) {
        callback(err);
      }

      this._initialized = true;
      callback();
    });
  },

  getDriverType: function() {
    return process.env.IAAS;
  },

  find: function(callback) {
    return driver.find(callback);
  },

  create: function(data) {
    return driver.create(data);
  }
};
