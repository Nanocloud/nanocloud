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

/* globals AccessToken */

const sha1 = require("sha1");

module.exports = function(req, res, next) {
  let filename = req.query["filename"];
  let downloadToken = req.query["token"];

  let timestamp = Date.now() / 1000;
  let timeStone = timestamp + (3600 - timestamp % 3600);

  AccessToken.findById(downloadToken.split(":")[0], (err, accessTokens) => {
    let accessToken = accessTokens[0];
    let expectedToken = accessToken.id + ":" + sha1(accessToken.token + ":" + filename + ":" + timeStone);

    if (expectedToken !== downloadToken) {
      next(new Error("Wrong download token"));
    }
    next();
  });
};