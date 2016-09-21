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
/* globals sails, App, AccessToken, User, Group, MachineService, Machine, Image */

var nano = require('./lib/nanotest');
var chai = require('chai');
var expect = chai.expect;
var http = require('http');
const Promise = require('bluebird');

module.exports = function() {
  describe('Plaza app launch', function() {

    let fakePlaza = null;
    let appId = '9282fd13-5df0-4cf6-a101-ae507f75ab47';
    let appOpened = []; // Use by fake plaza to hold application status
    let originalFakePlazaPort = null;

    const expectedSchema = {
      type: 'object',
      properties: {
        'alias': {type: 'string'},
        'display-name': {type: 'string'},
        'file-path': {type: 'string'},
        'state': {type: 'string'},
        'image': {type: ['string', 'null']},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'}
      },
      required: ['alias', 'display-name', 'file-path', 'state', 'created-at', 'updated-at'],
      additionalProperties: false
    };

    before('Launch fake plaza', function(done) {
      fakePlaza = http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'application/json'});

        var body = [];
        req.on('error', function(err) {
          console.error(err);
        }).on('data', function(chunk) {
          body.push(chunk);
        }).on('end', function() {
          body = Buffer.concat(body).toString();

          if (req.url === '/exec') {
            appOpened.push(JSON.parse(body));
            res.end();
          }

          return res.end();
        });
      }).listen(0);

      App.create({
        id: appId,
        alias: 'fake',
        displayName: 'Fake Application',
        filePath: 'C:\\fake.exe'
      })
        .then(() => {
          return MachineService.getMachineForUser({
            id: nano.adminId()
          });
        })
        .then((machine) => {
          originalFakePlazaPort = machine.plazaport;

          return Machine.update({
            id: machine.id
          }, {
            plazaport: fakePlaza.address().port
          });
        })
        .then(() => {
          return done();
        });
    });

    after('Remove created application', function(done) {

      App.destroy(appId)
        .then(() => {
          return MachineService.getMachineForUser({
            id: nano.adminId()
          });
        })
        .then((machine) => {

          return Machine.update({
            id: machine.id
          }, {
            plazaport: originalFakePlazaPort
          });
        })
        .then(() => {
          return done();
        });
    });

    it('Should launch an app when app.state === running', function(done) {

      return nano.request(sails.hooks.http.app)
        .patch('/api/apps/' + appId)
        .send({
          'data': {
            'id': appId,
            'attributes': {
              id: appId,
              alias: 'fake',
              displayName: 'Fake Application',
              filePath: 'C:\\fake.exe',
              state: 'running'
            }
          }
        })
        .set(nano.adminLogin())
        .expect(200)
        .expect(nano.jsonApiSchema(expectedSchema))
        .then(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              expect(appOpened).to.deep.include({
                command: [
                  'C:\\fake.exe'
                ],
                username: 'Administrator'
              });

              return resolve();
            }, 100);
          });
        })
        .then(() => {
          return done();
        })
        .catch(done);
    });
  });

  describe('Group image permission', function() {
    let app1 = null;
    let app2 = null;
    let group1 = null;
    let group2 = null;
    let someguy = null;
    let someotherguy = null;
    let someguytoken = null;
    let someotherguytoken = null;
    let image = null;

   /*
    * For this testing, let's have:
    * - 1 default image
    * - 2 groups (group1 and group2)
    * - 3 users (admin, someguy and someotherguy)
    * - 2 apps (app1 and app2 which is the desktop)
    * image has app1 and desktop has apps
    * group1 has admin and someotherguy as users and image as image
    * group2 has someguy and someotherguy as users and no link to any image
    */
    before('Add proper groups, users and app for testing', function(done) {

      Image.findOne({
        default: true
      })
      .populate('apps')
        .then((defaultImage) => {

          image = defaultImage.id;
          app2 = defaultImage.apps[0].id;

          return Group.create({
            name: 'group1'
          });
        })
      .then((res) => {
        group1 = res.id;

        return Group.create({
          name: 'group2'
        });
      })
      .then((res) => {
        group2 = res.id;

        return User.create({
          email: 'someguy@nanocloud.com',
          firstName: 'someguy',
          lastName: 'someguy',
          password: 'Nanocloud123+',
          isAdmin: false
        });
      })
      .then((res) => {
        someguy = res.id;

        return User.create({
          email: 'someotherguy@nanocloud.com',
          firstName: 'someotherguy',
          lastName: 'someotherguy',
          password: 'Nanocloud123+',
          isAdmin: false
        });
      })
      .then((res) => {
        someotherguy = res.id;

        return AccessToken.create({
          userId: someguy
        });
      })
      .then((res) => {
        someguytoken = res.token;

        return AccessToken.create({
          userId: someotherguy
        });
      })
      .then((res) => {
        someotherguytoken = res.token;

        return App.create({
          alias: 'app1',
          displayName: 'app1',
          filePath: 'C:\\invalid.exe'
        });
      })
      .then((res) => {
        app1 = res.id;

        Image.update(image, {
          apps: [
            app1
          ]
        });
      })
      .then(() => {

        return nano.request(sails.hooks.http.app)
          .patch('/api/groups/' + group1)
          .send({
            'data': {
              'id': group1,
              'attributes': {
                'name': 'group1'
              },
              'relationships': {
                'images': {
                  'data': [{
                    'type': 'images',
                    'id': image
                  }]
                },
                'members': {
                  'data': [{
                    'type': 'users',
                    'id': someotherguy
                  }, {
                    'type': 'users',
                    'id': nano.adminId()
                  }]
                }
              },
              'type': 'groups'
            }
          })
        .set(nano.adminLogin())
          .expect(200);
      })
      .then(() => {

        return nano.request(sails.hooks.http.app)
          .patch('/api/groups/' + group2)
          .send({
            'data': {
              'id': group2,
              'attributes': {
                'name': 'group2'
              },
              'relationships': {
                'members': {
                  'data': [{
                    'type': 'users',
                    'id': someotherguy
                  }, {
                    'type': 'users',
                    'id': someguy
                  }]
                }
              },
              'type': 'groups'
            }
          })
        .set(nano.adminLogin())
          .expect(200);
      })
      .then(() => {
        return done();
      });
    });

    after('Cleaning groups', function(done) {

      Group.query('DELETE FROM public.group', () => {
        return User.destroy([
            someguy,
            someotherguy
        ])
          .then(() => {
            return App.destroy([
                app1,
                app2
            ]);
          })
        .then(() => {
          return done();
        });
      });
    });

    it('Admins should be able to list all apps', function(done) {

      nano.request(sails.hooks.http.app)
        .get('/api/apps')
        .set(nano.adminLogin())
        .expect(200)
        .expect((res) => {
          expect(res.body.data).to.have.length(2);
        })
      .expect((res) => {
        expect(res.body.data[0].id).to.equal(app2);
        expect(res.body.data[1].id).to.equal(app1);
      })
      .then(() => {
        return done();
      });
    });

    it('Regular users should only be able to retrieve apps included in groups they are member of', function(done) {

      nano.request(sails.hooks.http.app)
        .get('/api/apps')
        .set({
          'Authorization': 'Bearer ' + someguytoken
        })
      .expect(200)
        .expect((res) => {
          expect(res.body.data).to.have.length(0);
        })
      .then(() => {
        nano.request(sails.hooks.http.app)
          .get('/api/apps')
          .set({
            'Authorization': 'Bearer ' + someotherguytoken
          })
        .expect(200)
          .expect((res) => {
            expect(res.body.data).to.have.length(1);
          })
        .expect((res) => {
          var app2CreationDate = res.body.data[0].attributes['created-at'];
          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app2,
            'attributes': {
              'alias': 'Desktop',
              'display-name': 'Desktop',
              'file-path': 'C:\\Windows\\explorer.exe',
              'state': null,
              'created-at': app2CreationDate,
              'updated-at': app2CreationDate
            },
            'relationships': {
              'image': {
                'data': {
                  'type': 'images',
                  'id': image
                }
              }
            }
          });
        })
        .then(() => {
          return done();
        });
      });
    });

    it('Admins should be able to get connection out of every app', function(done) {

      MachineService.getMachineForUser({
        id: nano.adminId()
      })
      .then((machine) => {
        nano.request(sails.hooks.http.app)
          .get('/api/apps/connections')
          .set(nano.adminLogin())
          .expect(200)
          .expect((res) => {
            expect(res.body.data).to.have.length(2);
          })
        .expect((res) => {
          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app2,
            'attributes': {
              'hostname': '127.0.0.1',
              'port': 3389,
              'username': 'Administrator',
              'password': null,
              'remote-app': '',
              'protocol': 'rdp',
              'app-name': 'Desktop',
              'machine-id': machine.id,
              'machine-type': 'dummy',
              'machine-driver': 'dummy'
            }
          });
          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app1,
            'attributes': {
              'hostname': '127.0.0.1',
              'port': 3389,
              'username': 'Administrator',
              'password': null,
              'remote-app': '',
              'protocol': 'rdp',
              'app-name': 'app1',
              'machine-id': machine.id,
              'machine-type': 'dummy',
              'machine-driver': 'dummy'
            }
          });
        })
        .then(() => {
          return done();
        });
      });
    });

    it('Regular users should be able to get connections out of their apps', function(done) {

      MachineService.getMachineForUser({
        id: someguy
      })
      .then(() => {
        nano.request(sails.hooks.http.app)
          .get('/api/apps/connections')
          .set({
            'Authorization': 'Bearer ' + someguytoken
          })
        .expect(200)
          .expect((res) => {
            expect(res.body.data).to.have.length(0);
          })
        .then(() => {
          return done();
        });
      });
    });
  });
 };
