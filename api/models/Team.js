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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Team.js
 *
 * @description :: Team's model
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* globals ConfigService, PlazaService */

const uuid = require('node-uuid');
const randomstring = require('randomstring');

module.exports = {

  autoPK: false,

  attributes: {
    id: {
      type: 'string',
      primaryKey: true,
      uuidv4: true,
      defaultsTo() {
        return uuid.v4();
      }
    },
    username: {
      type: 'string',
      defaultsTo() {
        return randomstring.generate({
          length: 30,
          charset: 'alphabetic',
          capitalization: 'lowercase',
        });
      }
    },
    password: {
      type: 'string',
      defaultsTo() {
        return randomstring.generate(60);
      }
    },

    name: {
      type: 'string',
      unique: true
    },

    members: {
      collection: 'user',
      via: 'team'
    },

    pendingMembers: {
      collection: 'pendinguser',
      via: 'team'
    }
  },

  beforeCreate: function(values, next) {

    ConfigService.get('teamStorageAddress', 'teamStoragePort')
      .then((config) => {
        return PlazaService.exec(
          config.teamStorageAddress,
          config.teamStoragePort, {
            command: ['useradd',
                      values.username,
                      '--create-home',
                      '--groups',
                      'users'
                     ],
            wait: true
          })
          .then(() => {
            return PlazaService.exec(
              config.teamStorageAddress,
              config.teamStoragePort, {
                command: ['smbpasswd',
                          '-a',
                          values.username
                         ],
                stdin: values.password + '\n' + values.password,
                wait: true
              });
          })
          .then(() => {
            return next();
          })
          .catch(next);
      });
  }
};
