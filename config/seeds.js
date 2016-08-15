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

module.exports.seeds = {
  client: {
    data: [
      {
        name: 'frontend',
        clientId: '9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae',
        clientSecret: ''
      }
    ],
    unique: ['name', 'clientId']
  },
  user: {
    data: [
      {
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
        firstName: 'Admin',
        lastName: 'Nanocloud',
        password: 'admin',
        email: 'admin@nanocloud.com',
        activated: true,
        isAdmin: true
      }
    ],
    unique: ['email']
  },
  app: {
    data: [
      {
        alias: 'Desktop',
        displayName: 'Desktop',
        filePath: 'C:\\Windows\\explorer.exe',
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      }
    ],
    unique: ['alias']
  }
};
