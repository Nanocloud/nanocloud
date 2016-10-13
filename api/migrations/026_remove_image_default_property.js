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

const uuid = require('uuid');

function up(knex) {

  return knex.schema.table('image', (table) => {
    table.dropColumn('default');
    table.boolean('deleted').defaultTo('false');
  })
    .then(() => {
      return knex.select('*').from('image');
    })
    .then((image) => {
      if (image.length !== 0) {
        let imageId = uuid.v4();
        return knex.insert({
          id: imageId,
          iaasId: null,
          buildFrom: null,
          name: 'Default',
          deleted: true
        }).into('image')
          .then(() => {
            return knex.insert({
              id: uuid.v4(),
              alias: 'Desktop',
              displayName: 'Desktop',
              filePath: 'C:\\Windows\\explorer.exe',
              image: imageId
            }).into('app');
          });
      }
    });
}

function down(knex) {
  return knex.schema.table('image', (table) => {
    table.dropColumn('deleted');
    table.boolean('default');
  });
}

module.exports = { up, down };
