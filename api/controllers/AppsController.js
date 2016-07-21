/**
 * AppsController
 *
 * @description :: Server-side logic for managing apps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals Apps, MachineService */

module.exports = {

  connections: function(req, res) {

    MachineService.getUserMachine(req.user, (err, userMachine) => {

      if (err) {
        return res.negotiate(err);
      }

      var connections = [];

      return Apps.find()
        .then((apps) => {
          apps.forEach((app) => {
            connections.push({
              id: app.id,
              hostname: userMachine.ip,
              port: 3389,
              username: 'Administrator',
              password: userMachine.adminPassword,
              "remote-app": '',
              protocol: 'rdp',
              "app-name": app.alias
            });
          });

          return res.ok(connections);
        })
        .catch((err) => {
          return res.negotiate(err);
        });
    });
  }
};
