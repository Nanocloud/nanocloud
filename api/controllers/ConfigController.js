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
 * ConfigController
 *
 * @description :: Server-side logic for managing configs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

/* globals Config, ConfigService */

module.exports = {

  create: function(req, res) {

    let key = req.body.data.attributes.key;
    let value = ConfigService.deserialize(key, req.body.data.attributes.value);

    ConfigService.set(key, value)
      .then(() => {
        Config.find({
          key : key
        })
        .then((createdEntry) => {
          return res.ok(createdEntry);
        });
      })
    .catch((err) => {
      return res.negotiate(err);
    });
  },

  find: function(req, res) {
    let keys = req.allParams().key.split(',');
    return ConfigService.get.apply(this, keys)
      .then((config) => {
        let data = [];
        for (var property in config) {
          if (config.hasOwnProperty(property)) {
            data.push({
              key: property,
              value : config[property]
            });
          }
        }
        return res.ok(data);
      })
      .catch(() => {
        return res.notFound('An error occured while retrieving config');
      });
  },

  update: function(req, res) {
    return res.forbidden();
  },

  destroy: function(req, res) {
    return res.forbidden();
  }
};

