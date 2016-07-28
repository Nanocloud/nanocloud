// jshint mocha:true

var nano = require('./lib/nanotest');
var expect = require('chai').expect;

module.exports = function() {

  describe("Auto sign-up", function() {

    before(function() {
      ConfigService.set('testSendMail', true);
      // it takes time to send a mail with nodemailer
      this.timeout(10000);
    });

    const expectedSchema = {
      type: 'object',
      properties: {
        'first-name': {type: 'string'},
        'last-name': {type: 'string'},
        'hashed-password': {type: 'string'},
        'email': {type: 'string'},
        'is-admin': {type: 'boolean'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'},
      },
      required: ['first-name', 'last-name', 'hashed-password', 'email', 'is-admin', 'created-at', 'updated-at'],
      additionalProperties: false,
    };

    describe("Auto signup", function() {

      it('Should create an entry in user table', function(done) {

        // adding user to pendinguser table
        nano.request(sails.hooks.http.app)
          .post('/api/pendingusers')
          .send({
            data: {
              attributes: {
                'first-name': "Firstname",
                'last-name': "Lastname",
                'email': "user@nanocloud.com",
                'password': "nanocloud"
              },
              type: 'pendingusers'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .then((res) => {

            // user has been added to pending user table
            return nano.request(sails.hooks.http.app)
              .get('/api/pendingusers')
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect((res) => {
                expect(res.body.data[0].attributes["first-name"]).to.equal('Firstname');
              })
          })
          .then((res) => {

            // activate user
            return nano.request(sails.hooks.http.app)
              .patch('/api/pendingusers/' + res.body.data[0].id)
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
          })
          .then((res) => {

            // user has been activated
            return nano.request(sails.hooks.http.app)
              .get('/api/users')
              .set(nano.adminLogin())
              .expect(200)
              .expect((res) => {
                expect(res.body.data[1].attributes["first-name"]).to.equal('Firstname');
              })
          })
          .then(() => {
            return done(); 
          })
      });
    });

    after(function() {
      ConfigService.unset('testSendMail');
    });
  });
};
