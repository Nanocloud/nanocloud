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

/* globals sails, MachineService */

const nano = require('./lib/nanotest');

module.exports = function() {

  describe('Security', function() {
    describe('History', function() {
      describe('Create history - Only possible from Guacamole', function() {

        it('Should not create history with no token', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/histories')
            .send({})
            .expect(401)
            .end(done);
        });
        it('Should not create history even with token', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/histories')
            .send({})
            .set(nano.adminLogin())
            .expect(401)
            .end(done);
        });
        it('Should not create history if coming from Guacamole', function(done) {
          MachineService.getMachineForUser({
            id: nano.adminId()
          })
            .then(() => {
              nano.request('http://localhost:1337')
                .post('/api/histories')
                .send()
                .expect(400)
                .end(done);
            });
        });
      });

      describe('Read history - Only possible has loggedin user', function() {
        it('Should not return history with no token', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/histories')
            .expect(401)
            .end(done);
        });
        it('Should return history with token', function(done) {
          nano.request(sails.hooks.http.app)
            .get('/api/histories')
            .set(nano.adminLogin())
            .expect(200)
            .end(done);
        });
    });

      describe('Update history - Only possible from Guacamole', function() {

        it('Should not update history with no token', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/histories/')
            .send({})
            .expect(401)
            .end(done);
        });
        it('Should not create history even with token', function(done) {
          nano.request(sails.hooks.http.app)
            .post('/api/histories')
            .send({})
            .set(nano.adminLogin())
            .expect(401)
            .end(done);
        });
        it('Should not create history if coming from Guacamole', function(done) {
          MachineService.getMachineForUser({
            id: nano.adminId()
          })
            .then(() => {
              nano.request('http://localhost:1337')
                .post('/api/histories/' + 'fakeid')
                .send([])
                .expect(400)
                .end(done);
            });
        });
      });

      describe('Delete history', function() {

        it('Should not delete with no token', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/histories')
            .expect(403)
            .end(done);
        });
        it('Should not delete even with a token', function(done) {
          nano.request(sails.hooks.http.app)
            .delete('/api/histories')
            .set(nano.adminLogin())
            .expect(403)
            .end(done);
        });
        it('Should not delete even from guacamole', function(done) {
          nano.request('http://localhost:1337')
            .delete('/api/histories')
            .expect(403)
            .end(done);
        });
      });
    });
  });
};
