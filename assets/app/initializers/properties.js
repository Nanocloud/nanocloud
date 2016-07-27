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

import Ember from 'ember';
import config from 'nanocloud/config/environment';

export function initialize(app) {
  /* global $:false */
  app.deferReadiness();

  Ember.$.getJSON('/api/properties')
  .then((res) => {
    let head = Ember.$(document.head);

    document.title = res.title;
    config.APP.name = res.title;

    $('title').text(res.title);
    let favicon = Ember.$('<link rel="shortcut icon">');
    favicon.attr('href', res.favicon);
    head.append(favicon);

    let s = Ember.$('<style></style>');
    s.html(res.style);
    head.append(s);
    app.advanceReadiness();
  });
}

export default {
  name: 'properties',
  initialize
};
