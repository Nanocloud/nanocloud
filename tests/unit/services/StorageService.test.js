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

/* global StorageService */
/* global User */

const expect = require('chai').expect;

describe('Find or create a storage', function() {
  before(function(done) {
    ConfigService.set("storageAddress", "localhost")
    .then(() => {
    ConfigService.set("storagePort", 9090)
    .then(() => {
      done();
    });
    });
  });

  it('Should return a Storage', function(done) {

    User.findOne({
      id: "aff17b8b-bf91-40bf-ace6-6dfc985680bb"
    })
    .then((user) => {
      return StorageService.findOrCreate(user);
    })
    .then((storage) => {
      expect(storage.username.length).to.equal(30);
      expect(storage.password.length).to.equal(60);
      expect(storage.hostname).to.equal("localhost");
      expect(storage.port).to.equal('9090');
      expect(storage.user).to.equal('aff17b8b-bf91-40bf-ace6-6dfc985680bb');
      done();
    });
  });
});
