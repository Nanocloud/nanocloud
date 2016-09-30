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

/* globals App */

const uuid = require('node-uuid');

module.exports = {

  autoPK: false,
  attributes: {
    id: {
      type: 'string',
      primaryKey: true,
      defaultsTo: function (){ return uuid.v4(); }
    },
    iaasId: {
      type: 'string'
    },
    name: {
      type: 'string'
    },
    buildFrom: {
      type: 'string'
    },
    default: {
      type: 'boolean'
    },
    password: {
      type: 'string',
      defaultsTo: null
    },
    groups: {
      collection: 'group',
      via: 'images',
      through: 'imagegroup'
    },
    apps: {
      collection: 'app',
      via: 'image',
    }
  },

  afterCreate: function(values, next){
    // Each image must have a "desktop" application by default
    App.create({
      alias: 'Desktop',
      displayName: 'Desktop',
      filePath: 'C:\\Windows\\explorer.exe',
      image: values.id
    })
      .then(() => {
        next();
      });
  }
};
