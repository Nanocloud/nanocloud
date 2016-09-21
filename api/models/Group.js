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
 * Group.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

/* globals Group */

const uuid = require('node-uuid');
const _    = require('lodash');

module.exports = {

  autoPK: false,

  attributes: {
    id: {
      type: 'string',
      primaryKey: true,
      uuidv4: true,
      defaultsTo: function (){ return uuid.v4(); }
    },
    name: {
      type: 'string'
    },
    members: {
      collection: 'user',
      via: 'groups',
      through: 'usergroup'
    },
    images: {
      collection: 'image',
      via: 'groups',
      through: 'imagegroup'
    }
  },

  afterDestroy(destroyedRecords, next) {
    if (!destroyedRecords.length) {
      return next();
    }

    const ids = destroyedRecords.map((r) => r.id);
    const bindings = _.times(ids.length, (i) => '$' + (i + 1));

    Group.query({
      text: `DELETE FROM "usergroup" WHERE "group" IN (${bindings})`,
      values: ids
    }, next);
  }
};
