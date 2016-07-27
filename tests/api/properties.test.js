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

var nano = require('./lib/nanotest');

module.exports = function() {

  describe('Properties', () => {

    describe('Retrieve properties', () => {

      it('Should return the default properties', (done) => {

        nano.request(sails.hooks.http.app)
        .get('/api/properties')
        .expect(200, {
          title: 'Nanocloud',
          primaryColor: '#006CB6',
          style: [
            '.sidebar-logo{background-image:url(/assets/images/logo.png)}',
            '.login-logo{background-image:url(/assets/images/logo.png)}',
            '.sidebar{background-color:#006CB6}'
          ].join(''),
          favicon: 'favicon.ico'
        }, done);
      });
    });
  });
};
