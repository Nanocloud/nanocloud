/**
 * Nanocloud, a comprehensive platform to turn any application into a cloud
 * solution.
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

/* PropertyController is responsible of the installation properties. Those are
 * publicly accessible (without authentication) and are firstly used to customize
 * the frontend.
 *
 * @class PropertyController
 */

/* globals ConfigService */

module.exports = {

  /**
   * find retreives all the properties
   *
   * @method find
   * @public true
   */
  find(req, res) {

    ConfigService.get(
      'title', 'favIconPath', 'logoPath', 'primaryColor'
    )
    .then((config) => {

      let logo = '';
      if (config.logoPath) {
        logo = [
          `.sidebar-logo{background-image:url(${config.logoPath})}`,
          `.login-logo{background-image:url(${config.logoPath})}`
        ].join('');
      }

      let favIcon = 'favicon.ico';
      if (config.favIconPath) {
        favIcon = config.favIconPath;
      }

      let sidebarColor = `.sidebar{background-color:${config.primaryColor}}`;

      res.send({
        primaryColor: config.primaryColor,
        title: config.title,
        style: logo + sidebarColor,
        favicon: favIcon
      });
    })
    .catch((err) => res.negotiate(err));
  }

};
