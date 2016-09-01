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

/* globals sails */

const Promise = require('bluebird');
const Knex    = require('knex');

function migrate(knex) {
  const cwd = process.cwd();

  return knex.migrate.latest({
    directory: './api/migrations'
  })
  .spread((batchNo, log) => {
    if (log.length === 0) {
      sails.log.info('Migration: Already up to date');
    } else {
      sails.log.info(`Batch ${batchNo} run: ${log.length} migrations`);
      log.forEach((log) => {
        sails.log.info(log.substr(cwd.length + 1));
      });
    }
  });
}

function seed(knex) {
  const cwd = process.cwd();

  return knex.seed.run({
    directory: './api/seeds'
  })
  .spread((log) => {
    if (log.length === 0) {
      sails.log.info('No seed files exist');
    } else {
      sails.log.info(`Ran ${log.length} seed files`);
      log.forEach((log) => {
        sails.log.info(log.substr(cwd.length + 1));
      });
    }
  });
}

function cleanUp() {
  if (process.env.TESTING) {
    sails.log.info('Cleanning up database');
    const connection = sails.config.connections[sails.config.models.connection];
    const database = connection.database;
    const knex = connect();

    return knex.raw(
      'select tablename from pg_tables where tableowner = :database',
      { database }
    )
    .then((res) => {
      return knex.transaction((trx) => {
        return Promise.map(res.rows, (row) => {
          return trx.raw(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
        })
        .then(trx.commit);
      });
    });
  }

  return Promise.resolve();
}

var _knex;
function connect() {
  if (!_knex) {
    const connection = sails.config.connections[sails.config.models.connection];

    _knex = Knex({
      client: 'pg',
      connection: {
        host: connection.host,
        user: connection.user,
        password: connection.password,
        database: connection.database
      }
    });
  }

  return _knex;
}

var _initializer;

function initialize() {
  if (!_initializer) {
    const knex = connect();

    _initializer = cleanUp()
    .then(() => {
      return migrate(knex);
    })
    .then(() => {
      return seed(knex);
    })
    .finally(() => {
      knex.destroy();
      _knex = undefined;
    });
  }
  return _initializer;
}

module.exports = { initialize };
