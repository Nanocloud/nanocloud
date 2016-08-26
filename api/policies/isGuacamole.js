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

/*
 * Pass to next middleware only if incoming request comes from Guacamole
 * For now we consider a request to originate from Guacamole if req.host is set to
 * "localhost:1337" which is the case for guacamole because it directly targets
 * the backend without passing through the proxy
 */
module.exports = function(req, res, next) {

  if (req.get('host') === 'localhost:1337') {
    return next(null);
  }

  return res.send(401, 'Request did not originate from local network');
};
