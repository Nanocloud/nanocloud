/**
 * MachineController
 *
 * @description :: Server-side logic for managing machines
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals MachineService */

module.exports = {

  find: function(req, res) {
    res.ok(MachineService.find());
  },

  create: function(req, res) {
    res.ok(MachineService.create(req.body));
  }
};
