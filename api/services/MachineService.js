const driver = require('../drivers/' + process.env.IAAS + '/driver');

module.exports = {

  getDriverType: function() {
    return process.env.IAAS;
  },

  find: function() {
    return driver.find();
  },

  create: function(data) {
    return driver.create(data);
  }
};
