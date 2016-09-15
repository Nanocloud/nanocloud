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
 *
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/*': { controller: 'Nanocloud', action: 'serve', skipAssets: false, skipRegex: /^\/api\/.*$/ },

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

  /**
  * PATCH /api/pendingusers/:id should not pass by update in NanocloudController
  * because we don't want to apply the isAuthorized policy to this specific endpoint.
  */
  'PATCH /api/pendingusers/:id': {
    controller: 'PendingUser',
    action: 'update'
  },

  'PATCH /api/reset-passwords/:id': {
    controller: 'Reset-password',
    action: 'update'
  },

  'PATCH /api/groups/:id': {
    controller: 'Group',
    action: 'update'
  },

  'PATCH /api/properties/:id': {
    controller: 'Property',
    action: 'update'
  },

  'PATCH /api/images/:id': {
    controller: 'Image',
    action: 'update'
  },

  'PATCH /api/:model/:id': {
    controller: 'Nanocloud',
    action: 'update'
  },

  'PATCH /api/teams/:id': {
    controller: 'Team',
    action: 'update'
  },

  'GET /api/apps/connections': {
    controller: 'App',
    action: 'connections'
  },

  'GET /api/apps/:id': {
    controller: 'App',
    action: 'findOne'
  },

  'GET /machines/users': {
    controller: 'Machine',
    action: 'users'
  },

  'POST /api/upload': {
    controller: 'Storage',
    action: 'upload'
  },

  'POST /api/files': {
    controller: 'Storage',
    action: 'create'
  },

  'DELETE /api/files': {
    controller: 'Storage',
    action: 'destroy'
  },

  'DELETE /api/storages/:id': {response: 'forbidden'},

  'POST /api/storages': {response: 'forbidden'},

  'GET /api/files': {
    controller: 'Storage',
    action: 'files'
  },

  'PATCH /api/files': {
    controller: 'Storage',
    action: 'rename'
  },

  'GET /api/files/token': {
    controller: 'Storage',
    action: 'token'
  },

  'GET /api/files/download': {
    controller: 'Storage',
    action: 'download',
  },

  'DELETE /api/sessions': {
    controller: 'Session',
    action: 'disconnect'
  }

};
