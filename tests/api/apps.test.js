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
/* globals sails, App, AccessToken, User, Group */

var nano = require('./lib/nanotest');
var chai = require('chai');
var expect = chai.expect;

module.exports = function() {
  describe('Group app permission', function() {

    let group1 = null;
    let group2 = null;
    let someguy = null;
    let someotherguy = null;
    let someguytoken = null;
    let someotherguytoken = null;
    let app1 = null;
    let app2 = null;
    /*
     * For this testing, let's have:
     * - 2 groups (group1 amd group2)
     * - 3 users (admin, someguy and someotherguy)
     * - 3 apps (desktop and app1 and app2)
     * group1 has admin and someotherguy as user and desktop + app1 as app
     * group2 has someguy and someotherguy as user and app1 + app2 as app
     */
    before('Add proper groups, users and app for testing', function(done) {

      Group.create({
        name: 'group1'
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

          return App.create({
            alias: 'app2',
            displayName: 'app2',
            filePath: 'C:\\invalid.exe'
          });
        })
        .then((res) => {
          app2 = res.id;

          return nano.request(sails.hooks.http.app)
            .patch('/api/groups/' + group1)
            .send({
              'data': {
                'id': group1,
                'attributes': {
                  'name': 'group1'
                },
                'relationships': {
                  'apps': {
                    'data': [{
                      'type': 'apps',
                      'id': app1
                    }, {
                      'type': 'apps',
                      'id': nano.desktopId()
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
                  'apps': {
                    'data': [{
                      'type': 'apps',
                      'id': app1
                    }, {
                      'type': 'apps',
                      'id': app2
                    }]
                  },
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

    it('Admins should be able to list all apps', function(done) {

      nano.request(sails.hooks.http.app)
        .get('/api/apps')
        .set(nano.adminLogin())
        .expect(200)
        .expect((res) => {
          expect(res.body.data).to.have.length(3);
        })
        .expect((res) => {

          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app1,
            'attributes': {
              'alias': 'app1',
              'display-name': 'app1',
              'file-path': 'C:\\invalid.exe'
            }
          });
          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app2,
            'attributes': {
              'alias': 'app2',
              'display-name': 'app2',
              'file-path': 'C:\\invalid.exe'
            }
          });
          expect(res.body.data).to.include({
            'type': 'apps',
            'id': nano.desktopId(),
            'attributes': {
              'alias': 'Desktop',
              'display-name': 'Desktop',
              'file-path': 'C:\\Windows\\explorer.exe'
            }
          });
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
          expect(res.body.data).to.have.length(2);
        })
        .expect((res) => {

          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app1,
            'attributes': {
              'alias': 'app1',
              'display-name': 'app1',
              'file-path': 'C:\\invalid.exe'
            }
          });
          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app2,
            'attributes': {
              'alias': 'app2',
              'display-name': 'app2',
              'file-path': 'C:\\invalid.exe'
            }
          });
        })
        .then(() => {
          nano.request(sails.hooks.http.app)
            .get('/api/apps')
            .set({
              'Authorization': 'Bearer ' + someotherguytoken
            })
            .expect(200)
            .expect((res) => {
              expect(res.body.data).to.have.length(3);
            })
            .expect((res) => {

              expect(res.body.data).to.include({
                'type': 'apps',
                'id': app1,
                'attributes': {
                  'alias': 'app1',
                  'display-name': 'app1',
                  'file-path': 'C:\\invalid.exe'
                }
              });
              expect(res.body.data).to.include({
                'type': 'apps',
                'id': app2,
                'attributes': {
                  'alias': 'app2',
                  'display-name': 'app2',
                  'file-path': 'C:\\invalid.exe'
                }
              });
              expect(res.body.data).to.include({
                'type': 'apps',
                'id': nano.desktopId(),
                'attributes': {
                  'alias': 'Desktop',
                  'display-name': 'Desktop',
                  'file-path': 'C:\\Windows\\explorer.exe'
                }
              });
            })
            .then(() => {
              return done();
            });
        });
    });

    it('Admins should be able to get connection out of every app', function(done) {

      nano.request(sails.hooks.http.app)
        .get('/api/apps/connections')
        .set(nano.adminLogin())
        .expect(200)
        .expect((res) => {
          expect(res.body.data).to.have.length(3);
        })
        .expect((res) => {

          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app1,
            'attributes': {
              'hostname': '127.0.0.1',
              'port': 3389,
              'username': null,
              'password': null,
              'remote-app': '',
              'protocol': 'rdp',
              'app-name': 'app1'
            }
          });
          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app2,
            'attributes': {
              'hostname': '127.0.0.1',
              'port': 3389,
              'username': null,
              'password': null,
              'remote-app': '',
              'protocol': 'rdp',
              'app-name': 'app2'
            }
          });
          expect(res.body.data).to.include({
            'type': 'apps',
            'id': nano.desktopId(),
            'attributes': {
              'hostname': '127.0.0.1',
              'port': 3389,
              'username': null,
              'password': null,
              'remote-app': '',
              'protocol': 'rdp',
              'app-name': 'Desktop'
            }
          });

        })
        .then(() => {
          return done();
        });
    });

    it('Regular users should be able to get connections out of their apps', function(done) {

      nano.request(sails.hooks.http.app)
        .get('/api/apps/connections')
        .set({
          'Authorization': 'Bearer ' + someguytoken
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).to.have.length(2);
        })
        .expect((res) => {

          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app1,
            'attributes': {
              'hostname': '127.0.0.1',
              'port': 3389,
              'username': null,
              'password': null,
              'remote-app': '',
              'protocol': 'rdp',
              'app-name': 'app1'
            }
          });
          expect(res.body.data).to.include({
            'type': 'apps',
            'id': app2,
            'attributes': {
              'hostname': '127.0.0.1',
              'port': 3389,
              'username': null,
              'password': null,
              'remote-app': '',
              'protocol': 'rdp',
              'app-name': 'app2'
            }
          });
        })
        .then(() => {
          return done();
        });
    });
  });
};
