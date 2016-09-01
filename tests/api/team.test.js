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
/* globals sails, AccessToken, ConfigService, User, Team */

var nano = require('./lib/nanotest');
var expect = require('chai').expect;

module.exports = function() {

  describe('Team', function() {

    const userExpectedSchema = {
      type: 'object',
      properties: {
        'first-name': {type: 'string'},
        'last-name': {type: 'string'},
        email: {type: 'string'},
        'is-admin': {type: 'boolean'},
        'is-team-admin': {type: 'boolean'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'},
      },
      required: ['first-name', 'last-name', 'email', 'is-admin', 'created-at', 'updated-at'],
      additionalProperties: true, // expiration days
    };

    const teamExpectedSchema = {
      type: 'object',
      properties: {
        username: {type: 'string'},
        password: {type: 'string'},
        name: {type: 'string'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'}
      },
      required: ['name', 'username', 'password'],
      additionalProperties: false
    };

    let teamAdmin = null;
    let teamAdminToken = null;
    let teamMemberId = null;
    let teamId = null;

    before((done) => {
      ConfigService.set('teamStorageAddress', 'localhost')
      .then(() => {
        return ConfigService.set('teamStoragePort', 9091);
      })
      .then(() => {
        return ConfigService.set('testMail', true);
      })
      .then(() => {
        return User.create({
          firstName: 'TeamAdminFirstname',
          lastName: 'TeamAdminLastname',
          password: 'nanocloud',
          email: 'teamAdmin@nanocloud.com',
          isAdmin: false,
          expirationDate: null,
        });
      })
      .then((user) => {
        teamAdmin = user;
        return AccessToken.create({
          userId: user.id
        });
      })
      .then((res) => {
        teamAdminToken = res.token;
      })
      .then(done);
    });

    describe('Create a team with normal user', function() {
      it('Should return created team', function(done) {
        nano.request(sails.hooks.http.app)
          .post('/api/teams')
          .send({
            data: {
              attributes: {
                name: 'Teamee',
              },
              type: 'team'
            }
          })
          .set('Authorization', 'Bearer ' + teamAdminToken)
          .expect(201)
          .expect(nano.jsonApiSchema(teamExpectedSchema))
          .expect((res) => {
            let userId = res.body.data.relationships.members.data[0].id;
            teamId = res.body.data.id;
            expect(userId).to.equal(teamAdmin.id);

            User.findOne(teamAdmin.id)
              .then((user) => {
                expect(user.isTeamAdmin).to.equal(true);
                expect(user.team).to.equal(res.body.data.id);
              });
          })
          .end(done);
      });
    });

    describe('Create a new team member', function() {
      it('Should return new team member', function(done) {
        nano.request(sails.hooks.http.app)
          .post('/api/pendingusers')
          .set('Authorization', 'Bearer ' + teamAdminToken)
          .send({
            data: {
              attributes: {
                'first-name': 'TeamMemberFirstname',
                'last-name': 'TeamMemberLastname',
                password: 'nanocloud',
                email: 'teamMember@nanocloud.com',
                'is-team-admin': false,
                'is-admin': false,
                expirationDate: null,
                credit: null,
              },
              relationships: {
                team: {
                  data: {
                    type: 'teams',
                    id: teamId
                  },
                  groups: {
                    data: []
                  }
                },
              },
              type: 'pendingusers'
            }
          })
          .expect(201)
          .expect(nano.jsonApiSchema(userExpectedSchema))
          .then((res) => {
            teamMemberId = res.body.data.id;
            // user has been added to pending user table
            return nano.request(sails.hooks.http.app)
              .get('/api/pendingusers')
              .set(nano.adminLogin())
              .expect(200);
          })
          .then(() => {
            // activate user
            return nano.request(sails.hooks.http.app)
              .patch('/api/pendingusers/' + teamMemberId)
              .expect(200);
          })
          .then((res) => {
            teamMemberId = res.body.data.id;
            return User.findOne(teamMemberId);
          })
          .then((user) => {
            expect(user.isTeamAdmin).to.equal(false);
            expect(user.team).to.equal(teamId);
          })
          .then(() => {
            done();
          });
      });
    });

    describe('Grant a team member "team admin" rights', function() {
      it('Should promote a team member as a team admin', function(done) {

        nano.request(sails.hooks.http.app)
          .patch('/api/users/' + teamMemberId)
          .send({
            data: {
              attributes: {
                'is-team-admin': true,
              },
              type: 'users',
              id: teamMemberId
            }
          })
          .set('Authorization', 'Bearer ' + teamAdminToken)
          .expect(200)
          .expect(nano.jsonApiSchema(userExpectedSchema))
          .then(() => {
            return User.findOne(teamMemberId);
          })
          .then((user) => {
            expect(user.isTeamAdmin).to.equal(true);
            expect(user.team).to.equal(teamId);
          })
          .then(() => {
            done();
          });
      });
    });

    describe('It should be impossible to create two teams with the same name', function() {

      let user1;
      let user2;

      before('Create users and teams', function(done) {

        User.create({
          email: 'user1@nanocloud.com',
          team: null,
          isTeamAdmin: false,
          isAdmin: false
        })
          .then((user) => {
            user1 = user;
          })
          .then(() => {
            return User.create({
              email: 'user2@nanocloud.com',
              team: null,
              isTeamAdmin: false,
              isAdmin: false
            });
          })
          .then((user) => {
            user2 = user;
          })
          .then(() => {
            return AccessToken.create({
              userId: user1.id
            });
          })
          .then((user1token) => {
            user1.token = user1token.token;
          })
          .then(() => {
            return AccessToken.create({
              userId: user2.id
            });
          })
          .then((user2token) => {
            user2.token = user2token.token;
          })
          .then(() => {
            return done();
          });
      });

      after('Cleaning users and access tokens', function(done) {

        User.destroy([
          user1.id,
          user2.id
        ])
          .then(() => {
            return AccessToken.destroy({
              token: [user1.token, user2.token]
            });
          })
          .then(() => {
            return Team.destroy({
              name: 'Unique name'
            });
          })
          .then(() => {
            return done();
          });
      });

      it('Should return a bad request', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/teams/')
          .send({
            data: {
              attributes: {
                name: 'Unique name'
              },
              type: 'teams'
            }
          })
          .set('Authorization', 'Bearer ' + user1.token)
          .expect(201)
          .then(() => {
            return nano.request(sails.hooks.http.app)
              .post('/api/teams/')
              .send({
                data: {
                  attributes: {
                    name: 'Unique name'
                  },
                  type: 'teams'
                }
              })
              .set('Authorization', 'Bearer ' + user2.token)
              .expect(400);
          })
          .then(() => {
            done();
          });
      });
    });

    describe('It should be impossible to to join two teams', function() {

      let user1;

      before('Create users and teams', function(done) {

        User.create({
          email: 'user1@nanocloud.com',
          team: null,
          isTeamAdmin: false,
          isAdmin: false
        })
          .then((user) => {
            user1 = user;
          })
          .then(() => {
            return AccessToken.create({
              userId: user1.id
            });
          })
          .then((user1token) => {
            user1.token = user1token.token;
          })
          .then(() => {
            return done();
          });
      });

      after('Cleaning user and access tokens', function(done) {

        User.destroy(user1.id)
          .then(() => {
            AccessToken.destroy({
              token: user1.token
            });
          })
          .then(() => {
            return Team.destroy({
              name: 'Unique name'
            });
          })
          .then(() => {
            return done();
          });
      });

      it('Should return a bad request', function(done) {

        nano.request(sails.hooks.http.app)
          .post('/api/teams/')
          .send({
            data: {
              attributes: {
                name: 'Unique name'
              },
              type: 'teams'
            }
          })
          .set('Authorization', 'Bearer ' + user1.token)
          .expect(201)
          .then(() => {
            return nano.request(sails.hooks.http.app)
              .post('/api/teams/')
              .send({
                data: {
                  attributes: {
                    name: 'Another Unique name'
                  },
                  type: 'teams'
                }
              })
              .set('Authorization', 'Bearer ' + user1.token)
              .expect(400);
          })
          .then(() => {
            done();
          });
      });
    });
  });
};
