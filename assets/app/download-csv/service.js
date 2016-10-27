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
import formatTimeDuration from 'nanocloud/utils/format-duration';

export default Ember.Service.extend({

  getCsvBase64(model) {

    var csvContent = 'USERID,USER,APPLICATION,DRIVER,MACHINEID,MACHINESIZE,STARTDATE,ENDDATE,DURATION\n';

    model.forEach(function(item) {
      csvContent +=
        item.get('userId') + ',' +
        item.get('userFullName') + ',' +
        item.get('applicationName') + ',' +
        item.get('machineDriver') + ',' +
        item.get('machineId') + ',' +
        item.get('machineType') + ',' +
        item.get('startDate') + ',' +
        item.get('endDate') + ',' +
        formatTimeDuration(item.get('duration') / 1000) + '\n';
    });
    return btoa(csvContent);
  }
});
