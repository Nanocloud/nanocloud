/**
 * Nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud.
 *
 * Nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

// jshint mocha:true
/* globals sails, Group, Image */

var nano = require('./lib/nanotest');
var chai = require('chai');
var expect = chai.expect;

module.exports = function() {

  describe('Group', function() {

    afterEach('Cleaning database', function(done) {

      Group.query('DELETE FROM public.group', done);
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

    describe('Create group', function() {

      it('Should return created group', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            'data': {
              'attributes': {
                'name': 'Test group'
              },
              'type': 'groups'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then(() => {

            return nano.request(sails.hooks.http.app)
              .get('/api/groups')
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect((res) => {
                expect(res.body.data[0].attributes.name).to.equal('Test group');
              });
          })
          .then(() => {
            return done();
          });
      });
    });

    describe('Rename group', function() {

      it('Should return renamed group', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            'data': {
              'attributes': {
                'name': 'Group to rename'
              },
              'type': 'groups'
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
                'data': {
                  'attributes': {
                    'name': 'Group renamed'
                  },
                  'type': 'groups',
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
          .then(() => {

            return nano.request(sails.hooks.http.app)
              .get('/api/groups')
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect((res) => {
                expect(res.body.data[0].attributes.name).to.equal('Group renamed');
              });
          })
          .then(() => {
            return done();
          });
      });
    });

    describe('Remove group', function() {

      it('Should leave no trace of the removed group', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            'data': {
              'attributes': {
                'name': 'Group to removed'
              },
              'type': 'groups'
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
                'meta': {
                }
              });
          })
          .then(() => {

            return nano.request(sails.hooks.http.app)
              .get('/api/groups')
              .set(nano.adminLogin())
              .expect(200)
              .expect({
                data: []
              });
          })
          .then(() => {
            return done();
          });
      });
    });

    describe('Fetch a specific group\'s informations', function() {

      it('Should return created group', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            'data': {
              'attributes': {
                'name': 'Group'
              },
              'type': 'groups'
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
          .then(() => {
            return done();
          });
      });
    });

    describe('Add user to a group', function() {

      it('Should return group with user relationship', function(done) {

        var groupID = null;

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            'data': {
              'attributes': {
                'name': 'Group to add user to'
              },
              'type': 'groups'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then((res) => {

            groupID = res.body.data.id;

            return nano.request(sails.hooks.http.app)
              .patch('/api/groups/' + groupID)
              .send({
                'data': {
                  'id': groupID,
                  'attributes': {
                    'name': 'Group to add user to'
                  },
                  'relationships': {
                    'members': {
                      'data': [{
                        'type': 'users',
                        'id': nano.adminId()
                      }]
                    }
                  },
                  'type': 'groups'
                }
              })
              .set(nano.adminLogin())
              .expect(200)
              .expect((res) => {
                expect(res.body.data).to.be.an('object');
              })
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect(nano.jsonApiRelationship({
                'members': [{
                  type: 'users',
                  id: nano.adminId()
                }]
              }));
          })
          .then(() => {
            return nano.request(sails.hooks.http.app)
              .get('/api/groups')
              .set(nano.adminLogin())
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema));
          })
          .then(() => {
            return nano.request(sails.hooks.http.app)
              .post('/api/users')
              .send({
                data: {
                  attributes: {
                    'first-name': 'Firstname',
                    'last-name': 'Lastname',
                    'email': 'usergroup@nanocloud.com',
                    'password': 'nanocloud',
                    'is-admin': false
                  },
                  type: 'users'
                }
              })
              .set(nano.adminLogin())
              .expect(201);
          })
          .then((res) => {

            let userID = res.body.data.id;

            return nano.request(sails.hooks.http.app)
              .patch('/api/groups/' + groupID)
              .send({
                'data': {
                  'id': groupID,
                  'attributes': {
                    'name': 'Group to add user to'
                  },
                  'relationships': {
                    'members': {
                      'data': [{
                        'type': 'users',
                        'id': nano.adminId()
                      }, {
                        'type': 'users',
                        'id': userID
                      }]
                    }
                  },
                  'type': 'groups'
                }
              })
              .set(nano.adminLogin())
              .expect(200)
              .expect((res) => {
                expect(res.body.data).to.be.an('object');
              })
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect(nano.jsonApiRelationship({
                'members': [{
                  type: 'users',
                  id: nano.adminId()
                }, {
                  type: 'users',
                  id: userID
                }]
              }));
          })
          .then(() => {
            return done();
          });
      });
    });

    describe('Remove user from a group', function() {

      it('Should return group without user relationship', function(done) {

        var groupID = null;

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            'data': {
              'attributes': {
                'name': 'Group to remove user from'
              },
              'type': 'groups'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then((res) => {

            groupID = res.body.data.id;

            return nano.request(sails.hooks.http.app)
              .patch('/api/groups/' + groupID)
              .send({
                'data': {
                  'id': groupID,
                  'attributes': {
                    'name': 'Group to remove user from'
                  },
                  'relationships': {
                    'members': {
                      'data': [{
                        'type': 'users',
                        'id': nano.adminId()
                      }]
                    }
                  },
                  'type': 'groups'
                }
              })
              .set(nano.adminLogin())
              .expect(200)
              .expect((res) => {
                expect(res.body.data).to.be.an('object');
              })
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect(nano.jsonApiRelationship({
                'members': [{
                  type: 'users',
                  id: nano.adminId()
                }]
              }));
          })
          .then(() => {
            return nano.request(sails.hooks.http.app)
              .patch('/api/groups/' + groupID)
              .send({
                'data': {
                  'id': groupID,
                  'attributes': {
                    'name': 'Group to remove user from'
                  },
                  'relationships': {
                    'members': {
                      'data': []
                    }
                  },
                  'type': 'groups'
                }
              })
              .set(nano.adminLogin())
              .expect(200)
              .expect((res) => {
                expect(res.body.data).to.be.an('object');
              })
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect(nano.jsonApiRelationship({
                'members': []
              }));
          })
          .then(() => {
            return done();
          });
      });
    });

    describe('Add image to a group', function() {

      it('Should return group with images relationship', function(done) {

        var groupID = null;

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            'data': {
              'attributes': {
                'name': 'Group to add image to'
              },
              'type': 'groups'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then((res) => {

            groupID = res.body.data.id;
            return Image.findOne({
              default: true
            })
              .then((image) => {
                return nano.request(sails.hooks.http.app)
                  .patch('/api/groups/' + groupID)
                  .send({
                    'data': {
                      'id': groupID,
                      'attributes': {
                        'name': 'Group to add image to'
                      },
                      'relationships': {
                        'images': {
                          'data': [{
                            'type': 'images',
                            'id': image.id
                          }]
                        }
                      },
                      'type': 'groups'
                    }
                  })
                  .set(nano.adminLogin())
                  .expect(200)
                  .expect((res) => {
                    expect(res.body.data).to.be.an('object');
                  })
                  .expect(nano.jsonApiSchema(expectedSchema))
                  .expect(nano.jsonApiRelationship({
                    'images': [{
                      type: 'images',
                      id: image.id
                    }]
                  }));
              });
          })
          .then(() => {
            return done();
          });
      });
    });

    describe('Remove image from a group', function() {

      it('Should return group without any images relationship', function(done) {

        var groupID = null;

        nano.request(sails.hooks.http.app)
          .post('/api/groups')
          .send({
            'data': {
              'attributes': {
                'name': 'Group to remove image access from'
              },
              'type': 'groups'
            }
          })
          .set(nano.adminLogin())
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
          .then((res) => {

            groupID = res.body.data.id;

            return Image.findOne({
              default: true
            })
              .then((image) => {
                nano.request(sails.hooks.http.app)
                  .patch('/api/groups/' + groupID)
                  .send({
                    'data': {
                      'id': groupID,
                      'attributes': {
                        'name': 'Group to remove image access from'
                      },
                      'relationships': {
                        'images': {
                          'data': [{
                            'type': 'images',
                            'id': image.id
                          }]
                        }
                      },
                      'type': 'groups'
                    }
                  })
                  .set(nano.adminLogin())
                  .expect(200)
                  .expect((res) => {
                    expect(res.body.data).to.be.an('object');
                  })
                  .expect(nano.jsonApiSchema(expectedSchema))
                  .expect(nano.jsonApiRelationship({
                    'apps': [{
                      type: 'apps',
                      id: nano.desktopId()
                    }]
                  }));
              });
          })
          .then(() => {
            return nano.request(sails.hooks.http.app)
              .patch('/api/groups/' + groupID)
              .send({
                'data': {
                  'id': groupID,
                  'attributes': {
                    'name': 'Group to remove user from'
                  },
                  'relationships': {
                    'images': {
                      'data': []
                    }
                  },
                  'type': 'groups'
                }
              })
              .set(nano.adminLogin())
              .expect(200)
              .expect((res) => {
                expect(res.body.data).to.be.an('object');
              })
              .expect(nano.jsonApiSchema(expectedSchema))
              .expect(nano.jsonApiRelationship({
                'images': []
              }));
          })
          .then(() => {
            return done();
          });
      });
    });
  });
};
