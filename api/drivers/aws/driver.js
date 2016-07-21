/* globals Machine */

const baseDriver = require('../driver');
const extend = require('extend');
const pkgcloud = require('pkgcloud');
const Promise = require('bluebird');

module.exports = extend(baseDriver, {

  client: null,

  init: function(done) {

    this.client = pkgcloud.compute.createClient({
      provider: 'amazon',
      keyId: process.env.AWS_ACCESS_KEY_ID,
      key: process.env.AWS_PRIVATE_KEY,
      region: process.env.AWS_REGION
    });

    return done(null);
  },

  find: function(done) {

    this.client.getServers((err, servers) => {

      if (err) {
        return done(err);
      }

      let machineToCreate = [];
      servers.forEach((server) => {

        if (server.amazon.KeyName === process.env.AWS_PRIVATE_KEY_NAME) {
          machineToCreate.push(Machine.findOrCreate({
            id: server.id
          },{
            id: server.id,
            name: server.name || server.id,
            status: 'up',
            ip: server.amazon.PublicIpAddress,
            adminPassword: '',
            platform: 'aws'
          }));
        }
      });

      return Promise.all(machineToCreate)
        .then((machines) => {
          return done(null, machines);
        })
        .catch((err) => {
          return done(err);
        });
    });
  }
});
