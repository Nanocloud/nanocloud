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

/*jshint node:true*/
/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    // Add options here

    fingerprint: {
      exclude: ['logo']
    },
    emberCliFontAwesome: {
      useScss: true, // for ember-cli-sass
      useLess: false // for ember-cli-less
    },
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  app.import('vendor/guacamole-common-js.js', {
    type: 'vendor',
    prepend: true
  });

  app.import('vendor/webrtc-lib.js', {
    type: 'vendor',
    prepend: true
  });

  app.import('bower_components/bootstrap/dist/js/bootstrap.js');
  app.import('bower_components/humanize-duration/humanize-duration.js');

  app.import('bower_components/sweetalert/dist/sweetalert.min.js');
  app.import('bower_components/sweetalert/dist/sweetalert.css');
  app.import('bower_components/sweetalert/themes/google/google.css');

  return app.toTree();
};
