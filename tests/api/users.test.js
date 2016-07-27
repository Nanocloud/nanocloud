// jshint mocha:true

var nano = require('./lib/nanotest');

module.exports = function() {

  describe("Users", function() {

    const expectedSchema = {
      type: 'object',
      properties: {
        'email': {type: 'string'},
        'hashed-password': {type: 'string'},
        'activated': {type: 'boolean'},
        'is-admin': {type: 'boolean'},
        'first-name': {type: 'string'},
        'last-name': {type: 'string'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'}
      },
      required: ['email', 'activated', 'hashed-password', 'is-admin', 'first-name', 'last-name', 'created-at', 'updated-at'],
      additionalProperties: false
    };

    describe("Create user", function() {

      it('Should return created user', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/users')
          .send({
            data: {
              attributes: {
                'first-name': "Firstname",
                'last-name': "Lastname",
                'email': "user@nanocloud.com",
                'password': "nanocloud",
                'activated': true,
                'is-admin': false
              },
              type: 'users'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .end(done);
      });
    });

    describe("List users", function() {
      it('Should return user list as admin', function(done) {

        nano.request(sails.hooks.http.app)
          .get('/api/users')
          .set(nano.adminLogin())
          .expect(200)
          .expect(nano.jsonApiSchema(expectedSchema))
          .end(done);
      });
    });
  });
};
