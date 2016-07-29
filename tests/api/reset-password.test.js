// jshint mocha:true

var nano = require('./lib/nanotest');
var expect = require('chai').expect;

const ConfigService = global['ConfigService'];

module.exports = function() {

  describe("Reset password", function() {

    before(function() {
      ConfigService.set('testSendMail', true);
    });

    const expectedSchema = {};

    describe("Create a reset password token", function() {

      it('Should return empty meta', function(done) {

        // create user for testing
        nano.request(sails.hooks.http.app)
        .post('/api/users')
        .send({
          data: {
            attributes: {
              'first-name': "Firstname",
              'last-name': "Lastname",
              'email': "user@nanocloud.com",
              'password': "nanocloud",
              'is-admin': false
            },
            type: 'users'
          }
        })
        .set(nano.adminLogin())
        .expect(201)

        // test token creation
        .then(() => {
          // adding token to 'reset-password' table
          nano.request(sails.hooks.http.app)
          .post('/api/reset-passwords')
          .send({
            data: {
              attributes: {
                'email': "user@nanocloud.com",
                'password': null,
              },
              type: 'reset-password'
            }
          })
          .set(nano.adminLogin())
          .expect(200)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then(() => {
            // token has been added to 'reset-password' table
            return (nano.request(sails.hooks.http.app)
              .get('/api/reset-passwords')
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect((res) => {
                console.log(res.body.data[0]);
                expect(res.body.data[0].attributes["email"])
                  .to.equal('admin@nanocloud.');
              })
            );
          });
        })
        .then(() => {
          return done(); 
        })
        .catch((err) => {
          console.log("failure");
          console.log(err);
        });
      });
    });

    after(function() {
      ConfigService.unset('testSendMail');
    });
  });
};
