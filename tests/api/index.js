// jshint mocha:true

var request = require('supertest');

describe('nanocloud is Online', function() {

  it('Should return 200 on index', function (done) {
    request(sails.hooks.http.app)
      .get('/')
      .expect(200)
      .end(done);
  });
});
