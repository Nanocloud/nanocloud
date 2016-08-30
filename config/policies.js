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
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */

module.exports.policies = {

  '*': [
    function(req, res, next) {
      req.connection.setTimeout(10*60*1000);

      return next();
    },
    'isAuthorized'
  ],

  StorageController: {
    download: 'checkDownloadToken',
  },

  PropertyController: {
    find: true
  },

  configController: {
    create: 'isAdmin'
  },

  groupController: {
    create: 'isAdmin',
    find: 'isAdmin',
    findOne: 'isAdmin',
    update: 'isAdmin',
    destroy: 'isAdmin'
  },

  storageController: {
    create: false,
    find: false,
    findOne: false,
    destroy: false,
    download: 'checkDownloadToken'
  },

  imageController: {
    create: 'isAdmin',
    update: false,
    destroy: false
  },

  PendingUserController: {
    create: true,
    update: true,
    destroy: false,
  },

  'Reset-passwordController': {
    create: true,
    update: true,
    findOne: true
  },

  HistoryController : {
    destroy: false,
    create: ['isGuacamole'],
    update: ['isGuacamole']
  },
};
