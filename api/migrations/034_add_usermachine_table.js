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
    knex.schema.createTable('usermachine', (table) => {
      table.increments();

      table.string('user');
      table.string('machine');

      table.dateTime('createdAt');
      table.dateTime('updatedAt');
    }),

    knex('machine').select('id', 'user').whereNot({
      user: null
    }).then((machines) => {
      return Promise.map(machines, (machine) => {
        return knex.insert({
          machine: machine.id,
          user: machine.user
        }).into('usergroup');
      });
    })
    .then(() => {
      return knex.schema.table('machine', (table) => {
        return table.dropColumn('user');
      });
    })
  ]);
}

function down(knex) {
  return knex.schema.dropTable('usermachine');
}

module.exports = { up, down };
