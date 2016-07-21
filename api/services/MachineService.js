/* globals UserMachine, Machine */

const driver = require('../drivers/' + process.env.IAAS + '/driver');
const Promise = require('bluebird');
const JSONAPISerializer = require('json-api-serializer');
const Serializer = new JSONAPISerializer();

module.exports = {

  _initialized: false,

  init: function(callback) {

    return driver.init((err) => {

      if (err) {
        return callback(err);
      }

      this._initialized = true;
      return callback();
    });
  },

  getDriverType: function() {
    return process.env.IAAS;
  },

  getUserMachine: function(user, callback) {

    return UserMachine.findOne({
      'user': user.id
     }).populate('machine')
      .then((machine) => {

        if (machine === undefined) {
          sails.log.verbose("User " + user.id + " needs to be allocated a virtual machine.");
          Machine.find()
            .populate('users')
            .exec((err, machines) => {

              if (err) {
                callback(err);
              }

              let userMachine = null;
              machines.forEach((machine) => {
                if (machine.users.length === 0) {
                  userMachine = machine;
                }
              });

              if (userMachine === null) {
                return callback(new Error('No machine available'));
              }

              userMachine.users.add(user.id);
              userMachine.save((err) => {

                if (err) {
                  return callback(err);
                }

                return callback(null, userMachine);
              });
            });
        } else {
          sails.log.verbose("User " + user.id + " already have an allocated virtual machine: " + machine.id);

          return callback(null, machine);
        }
      })
      .catch((err) => {
        return callback(err);
      });
  },

  find: function(callback) {
    return driver.find((err, machines) => {

      if (err) {
        return callback(err);
      }

      let machineToPopulate = [];

      machines.forEach((machine) => {
        machineToPopulate.push(Machine.findOne({
          id: machine.id
        }).populate('users'));
      });

      return Promise.all(machineToPopulate)
        .then((machines) => {

          Serializer.register('machine', {
            id: 'id',
            convertCase: 'kebab-case',
            relationships: {
              users: {
                type: 'user'
              }
            }
          });

          Serializer.register('user', {
            id: 'id',
            convertCase: 'kebab-case'
          });

          return callback(null, Serializer.serialize('machine', machines));
        })
        .catch((err) => {
          return callback(err);
        });
    });
  },

  create: function(data) {
    return driver.create(data);
  }
};
