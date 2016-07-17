/**
 * Machine-driverController
 *
 * @description :: Server-side logic for managing machine-drivers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals MachineService */

module.exports = {

  find: function(req, res) {

    var machineDriver = {
      id: MachineService.getDriverType(),
      ID: MachineService.getDriverType()
    };

    res.ok(machineDriver);
  }
};
