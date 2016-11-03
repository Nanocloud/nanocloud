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

function up(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('appgroup', (table) => {
      table.increments();

      table.string('group');
      table.string('app');

      table.dateTime('createdAt');
      table.dateTime('updatedAt');
    }),

    knex('imagegroup').distinct('image').select()
      .then((images) => {
        return Promise.map(images, (image) => {
          return Promise.props({
            apps: knex('app').select().where({ image: image.image }),
            groups: knex('imagegroup').distinct('group').select().where({ image: image.image })
          })
            .then(({apps, groups}) => {
              return Promise.map(apps, (app) => {
                return Promise.map(groups, (group) => {
                  return knex.insert({
                    app: app.id,
                    group: group.group
                  }).into('appgroup');
                });
              });
          });
      });
     }),
  ]);
}

function down(knex) {
  return knex.schema.dropTable('appgroup');
}

module.exports = { up, down };
