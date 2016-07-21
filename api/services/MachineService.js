const driver = require('../drivers/' + process.env.IAAS + '/driver');

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

    return Machine.findOne({
      user: user.id
    })
      .then((machine) => {

        if (machine === undefined) {
          sails.log.verbose("User " + user.id + " needs to be allocated a virtual machine.");
          Machine.find()
            .populate('user')
            .exec((err, machines) => {

              if (err) {
                callback(err);
              }

              let machine = machines.pop();

              Machine.update(machine.id, {
                user: "1"
              }, (err, machine) => {

                if (err) {
                  return callback(err);
                }

                console.log(machine);
                return callback(null, machine.pop());
              });
            });
        } else {
          sails.log.verbose("User " + user.id + " already have an allocated virtual machine: " + machine.id);

          return callback(null, machine);
        }
      })
      .catch((err) => {
        callback(err);
      });
  },

  find: function(callback) {
    return driver.find(callback);
  },

  create: function(data) {
    return driver.create(data);
  }
};
