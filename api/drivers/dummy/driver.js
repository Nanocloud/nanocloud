/* globals Machine */

const baseDriver = require('../driver');
const extend = require('extend');

module.exports = extend(baseDriver, {

  init: function(done) {
    Machine.findOrCreate({
      ip: '127.0.0.1'
    },{
      name: 'Fake machine',
      status: 'up',
      ip: '127.0.0.1',
      adminPassword: 'password',
      platform: 'dummy'
    })
      .then(() => {
        return done(null);
      })
      .catch((err) => {
        return done(err);
      });
  },

  find: function(done) {
    Machine.find()
      .then((machines) => {
        return done(null, machines);
      })
      .catch((err) => {
        return done(err);
      });
  }
});
