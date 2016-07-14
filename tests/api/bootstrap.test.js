var sails = require('sails');

before(function(done) {

  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(5000);

  sails.lift({
    // configuration for testing purposes
  }, function(err, server) {

    // here you can load fixtures, etc.
    return done(err, sails);
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(done);
});
