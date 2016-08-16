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
 *
 */

/* global History */

const Promise = require('bluebird');
const moment = require('moment');

/**
 * Return the credit used with the machine for a user
 *
 */
function getUserHistory(user, driver) {
  let duration = [];
  let machines = [];

  return new Promise((resolve, reject) => {
    return History.find({
      userId: user.id,
      machineDriver: driver
    })
      .then((histo) => {
        return histo.forEach((element) => {
          var obj = machines.filter((obj) => {
            return obj.id === element.machineId;
          });
          if (!obj[0]) {
            machines.push({
              id: element.machineId,
              type: element.machineType,
              start: element.startDate,
              end: element.endDate
            });
          } else {
            if (obj[0].start > element.startDate) {
              obj[0].start = element.startDate;
            }
            if (obj[0].end < element.endDate) {
              obj[0].end = element.endDate;
            }
          }
        });
      })
      .then(() => {
        return machines.forEach((elem) => {
          elem.start = moment(new Date(elem.start));
          elem.end = moment(new Date(elem.end));
          var hoursDiff = elem.end.diff(elem.start, 'hours') + 1;

          duration.push({
            type: elem.type,
            time: hoursDiff
          });
        });
      })
      .then(() => {
        return resolve(duration);
      })
      .catch((err) => {
        console.log(err);
        return reject('No history found');
      });
  });
}

module.exports = {
  getUserHistory
};
