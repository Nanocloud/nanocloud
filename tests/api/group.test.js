// jshint mocha:true

var nano = require('./lib/nanotest');
var expect = require('chai').expect;

module.exports = function() {

  describe("Group", function() {

    afterEach('Cleaning database', function(done) {

      Group.query('TRUNCATE TABLE public.group', done);
    });

    const expectedSchema = {
      type: 'object',
      properties: {
        'name': {type: 'string'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'}
      },
      required: ['name'],
      additionalProperties: false
    };

    describe("Create group", function() {


      it('Should return created group', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            "data": {
              "attributes": {
                "name": "Test group"
              },
              "type": "groups"
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then((res) => {

            return nano.request(sails.hooks.http.app)
              .get('/api/groups')
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect((res) => {
                expect(res.body.data[0].attributes.name).to.equal('Test group');
              });
          })
          .then((res) => {
            return done();
          });
      });
    });

    describe("Rename group", function() {

      it('Should return renamed group', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            "data": {
              "attributes": {
                "name": "Group to rename"
              },
              "type": "groups"
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then((res) => {

            let groupId = res.body.data.id;

            return nano.request(sails.hooks.http.app)
              .patch('/api/groups/' + groupId)
              .send({
                "data": {
                  "attributes": {
                    "name": "Group renamed"
                  },
                  "type": "groups",
                  id: groupId
                }
              })
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect((res) => {
                expect(res.body.data).to.be.an('object');
              })
              .expect((res) => {
                expect(res.body.data.attributes.name).to.equal('Group renamed');
              });
          })
          .then((res) => {

            return nano.request(sails.hooks.http.app)
              .get('/api/groups')
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect((res) => {
                expect(res.body.data[0].attributes.name).to.equal('Group renamed');
              });
          })
          .then((res) => {
            return done();
          });
      });
    });

    describe("Remove group", function() {

      it('Should leave no trace of the removed group', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            "data": {
              "attributes": {
                "name": "Group to removed"
              },
              "type": "groups"
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then((res) => {

            let groupId = res.body.data.id;

            return nano.request(sails.hooks.http.app)
              .delete('/api/groups/' + groupId)
              .set(nano.adminLogin())
              .expect(200)
              .expect({
                  "meta": {
                  }
              });
          })
          .then((res) => {

            return nano.request(sails.hooks.http.app)
              .get('/api/groups')
              .set(nano.adminLogin())
              .expect(200)
              .expect({
                data: []
              });
          })
          .then((res) => {
            return done();
          });
      });
    });

    describe("Fetch a specific group's informations", function() {

      it('Should return created group', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            "data": {
              "attributes": {
                "name": "Group"
              },
              "type": "groups"
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then((res) => {

            let groupId = res.body.data.id;

            return nano.request(sails.hooks.http.app)
              .get('/api/groups/' + groupId)
              .set(nano.adminLogin())
              .expect(200)
              .expect((res) => {
                expect(res.body.data).to.be.an('object');
              })
              .expect(nano.jsonApiSchema(expectedSchema));
          })
          .then((res) => {
            return done();
          });
      });
    });

    describe("Add user to a group", function() {

      it('Should return group with user relationship', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            "data": {
              "attributes": {
                "name": "Group"
              },
              "type": "groups"
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then((res) => {

            let groupId = res.body.data.id;

            return nano.request(sails.hooks.http.app)
              .patch('/api/groups/' + groupId)
              .send({
                "data": {
                  "id": groupId,
                  "attributes": {
                    "name": "Group"
                  },
                  "relationships": {
                    "members": {
                      "data": [{
                        "type": "users",
                        "id": nano.adminId()
                      }]
                    }
                  },
                  "type": "groups"
                }
              })
              .set(nano.adminLogin())
              .expect(200)
              .expect((res) => {
                expect(res.body.data).to.be.an('object');
              })
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect(nano.jsonApiRelationship({
                'members': {
                  type: 'users',
                  id: nano.adminId()
                }
              }));
          })
          .then((res) => {
            return done();
          });
      });
    });
  });
};
