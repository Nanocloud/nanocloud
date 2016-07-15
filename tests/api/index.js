// jshint mocha:true

const testAuth = require('./auth.test');
const testUsers = require('./users.test');

var request = require('supertest');

describe('Nanocloud is Online', function() {

  it('Should return 200 on index', function (done) {
    request(sails.hooks.http.app)
      .get('/')
      .expect(200)
      .end(done);
  });
});

testAuth();
testUsers();
