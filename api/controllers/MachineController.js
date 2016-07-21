/**
 * MachineController
 *
 * @description :: Server-side logic for managing machines
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals MachineService */

module.exports = {

  find: function(req, res) {

    MachineService.find((err, machines) => {

      if (err) {
        return res.negotiate(err);
      }

      return res.send(machines); // TODO We will need to revert this back to res.ok
    });
  },

  create: function(req, res) {
    res.ok(MachineService.create(req.body));
  },

  users: function(req, res) {

    MachineService.find((err, machines) => {

      if (err) {
        res.negotiate(err);
      }

      res.send(machines);
    });
  }
};
