/* globals Machine */

const baseDriver = require('../driver');
const extend = require('extend');

module.exports = extend(baseDriver, {

  init: function(done) {
    Machine.findOrCreate({
      ip: process.env.EXECUTION_SERVERS
    },{
      name: 'Manual static',
      status: 'up',
      ip: process.env.EXECUTION_SERVERS,
      adminPassword: process.env.WINDOWS_PASSWORD,
      platform: 'manual'
    })
      .then(() => {
        return done(null);
      })
      .catch((err) => {
        return done(err);
      });
  }
});
