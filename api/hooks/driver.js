const MachineService = require('../services/MachineService');

module.exports = function(sails) {

  return {
    initialize: function(cb) {

      sails.after('hook:orm:loaded', function() {
        return MachineService.init(function(err) {

          const driverName = MachineService.getDriverType();

          if (err) {
            throw new Error('Fail to initialize ' + driverName + ' driver');
          }

          sails.log.info('Driver ' + driverName + ' is initialized');
         });
      });

      cb();
    }
  };
};
