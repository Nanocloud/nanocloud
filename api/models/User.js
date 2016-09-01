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
 */

/* globals Group */

const bcrypt = require('bcryptjs');
const uuid   = require('node-uuid');
const _      = require('lodash');

module.exports = {

  autoPK: false,

  attributes: {
    id: {
      type: 'string',
      primaryKey: true,
      unique: true,
      index: true,
      uuidv4: true,
      defaultsTo: function (){ return uuid.v4(); }
    },
    credit: {
      type: 'string',
      defaultsTo: '0'
    },
    firstName: {
      type: 'string'
    },
    lastName: {
      type: 'string'
    },
    hashedPassword: {
      type: 'string'
    },
    email: {
      type: 'string',
      unique: true
    },
    isAdmin: {
      type: 'boolean',
      defaultsTo: false
    },
    expirationDate: {
      type: 'integer'
    },
    isTeamAdmin: {
      type: 'boolean',
      defaultsTo: false
    },
    team: {
      model: 'team'
    },

    groups: {
      collection: 'group',
      via: 'members',
      through: 'usergroup'
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.password;
      delete obj.hashedPassword;
      return obj;
    }
  },

  beforeUpdate: function(values, next) {

    if (values.password) {
      var hash = bcrypt.hashSync(values.password, 10);
      values.hashedPassword = hash;
      delete values.password;
    }
    next();
  },

  beforeCreate: function(values, next){

    if (values.password) {
      var hash = bcrypt.hashSync(values.password, 10);
      values.hashedPassword = hash;
      delete values.password;
    }
    next();
  },

  afterDestroy(destroyedRecords, next) {
    if (!destroyedRecords.length) {
      return next();
    }

    const ids = destroyedRecords.map((r) => r.id);
    const bindings = _.times(ids.length, (i) => '$' + (i + 1));

    Group.query({
      text: `DELETE FROM "usergroup" WHERE "user" IN (${bindings})`,
      values: ids
    }, next);
  }
};
