const baseDriver = require('../driver');
const extend = require('extend');

module.exports = extend(baseDriver, {

  find: function() {
    return {
      id: 1,
      name: 'Static',
      status: 'up',
      ip: process.env.EXECUTION_SERVERS,
      adminPassword: process.env.WINDOWS_PASSWORD,
      platform: 'manual'
    };
  }
});
