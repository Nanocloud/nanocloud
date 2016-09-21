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

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');

function seed(knex) {

  let viewsDirectory = './api/views';
  let activationEmail = null;
  let resetPasswordEmail = null;

  return fs.readFileAsync(path.join(viewsDirectory, `activation-email.hbs`))
    .then((content) => {
      activationEmail = content;
      return fs.readFileAsync(path.join(viewsDirectory, `reset-password-email.hbs`))
        .then((content) => {
          resetPasswordEmail = content;
        });
    })
    .then(() => {
      return knex.raw(`
        INSERT INTO "template" (
          "id",
          "key",
          "subject",
          "content",
          "createdAt",
          "updatedAt"
        ) VALUES (
          :id1, :key1, :subject1, :content1, NOW(), NOW()
        ), (
          :id2, :key2, :subject2, :content2, NOW(), NOW()
        )
          ON CONFLICT DO NOTHING
        `, {
          id1: '1f300d1b-6aff-4029-b9b4-8c5d71074173',
          key1: 'activation',
          subject1: 'Nanocloud - Verify your email address',
          content1: activationEmail,
          id2: '03ef4f6a-9832-4964-813a-a84922a87918',
          key2: 'reset',
          subject2: 'Nanocloud - Reset your password',
          content2: resetPasswordEmail,
        });
    });
}

module.exports = { seed };
