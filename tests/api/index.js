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

/* globals sails */

const testAuth = require('./auth.test');
const testUsers = require('./users.test');
const testAutoSignup = require('./auto-signup.test');
const testResetPassword = require('./reset-password.test');
const testStorage = require('./storage.test');
const testUserLimitation = require('./user-limitation.test');
const testConfig = require('./config.test');
const testGroup = require('./group.test');
const testApps = require('./apps.test');
const testSecurity = require('./security.test');
const testSession = require('./session.test');
const testMachine = require('./machine.test');
const testImage = require('./image.test');
const testHistories = require('./histories.test');
const testTeam = require('./team.test');
const testTemplate = require('./template.test');

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
testAutoSignup();
testResetPassword();
testStorage();
testUserLimitation();
testConfig();
testGroup();
testApps();
testHistories();
testMachine();
testImage();
testSession();
testTeam();
testTemplate();
testSecurity();
