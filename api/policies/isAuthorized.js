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

var passport = require('passport');

/*
 * If request concerns the API (a.k.a target /api/*), we shall find the user
 * associated with the given token (if any).
 * This user will then be stored in *req.user* for future use.
 */
module.exports = function(req, res, next) {

  var originalUrl = req.originalUrl;
  var tokenizedOriginalUrl = originalUrl.split('/');

  if (tokenizedOriginalUrl[1] !== 'api'){
    return next(null);
  }

  return passport.authenticate('bearer', function(err, user) {

    if ((err) || (!user)) {
      return res.send(401);
    }

    delete req.query.access_token;
    req.user = user;

    return next(null);
  })(req, res);
};
