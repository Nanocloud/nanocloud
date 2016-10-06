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
    knex.schema.createTable('imagegroup', (table) => {
      table.increments();

      table.string('image').references('image.id').onDelete('CASCADE').onUpdate('CASCADE');
      table.string('group').references('group.id').onDelete('CASCADE').onUpdate('CASCADE');

      table.unique(['image', 'group']);
      table.dateTime('createdAt');
      table.dateTime('updatedAt');
    }),

    knex.schema.table('machine', (machine) => {
      machine.string('image').references('image.id');
    })
      .then(() => {
        return knex.schema.table('app', (user) => {
          user.string('image').references('image.id').onDelete('CASCADE').onUpdate('CASCADE');
        });
      })
      .then(() => {
        return knex('image').where({
          default: true
        });
      })
      .then((images) => {
        if (images.length > 0) {
          // We are able to assume there is only one image here
          return Promise.all([
            knex('app').update({
              image: images[0].id
            }),

            knex('appgroup').select('*')
              .then((appgroupRelations) => {
                return Promise.map(appgroupRelations, function(appgroupRelation) {
                  return knex.insert({
                    image: images[0].id,
                    group: appgroupRelation.group
                  }).into('imagegroup');
                });
              }),
          ]);
        }
      })
      .then(() => {
        return knex.schema.dropTable('appgroup', (user) => {
          user.string('image').references('image.id').onDelete('CASCADE').onUpdate('CASCADE');
        });
      })
  ]);
}

function down(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('imagegroup'),

    knex.schema.table('app', (table) => {
      table.dropColumn('image');
    }),

    knex.schema.table('machine', (table) => {
      table.dropColumn('image');
    }),
  ]);
}

module.exports = { up, down };
