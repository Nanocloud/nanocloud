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
const _ = require('lodash');

/**
 * Return time of use of all machines of the user
 *
 * @param {object} user The user we need for get the history
 * @param {object} driver The driver used by the user
 * @return {Promise[array[object]]}
 */
function getUserHistory(user, driver) {
  const historyQuery = Promise.promisify(History.query);
  let duration = [];
  let machines = [];

  return historyQuery({
    text: 'SELECT "startDate", "endDate", "machineId", "machineType" FROM history WHERE "userId" = $1 AND "machineDriver" = $2 ORDER BY "machineId", "startDate"',
    values: [user.id, driver]
  })
    .then((allHistories) => {
      var thisMonthStart = new Date(user.createdAt);
      thisMonthStart.setMonth(thisMonthStart.getMonth() + moment(new Date()).diff(moment(thisMonthStart), 'Month'));

      /**
       * Concatenate histories if their hours charged times overlap
       * It assign the current time to the empty endDate properties
       */

      allHistories = allHistories.rows;
      allHistories.forEach((element) => {
        element.startDate = new Date (element.startDate);

        /**
         * If the history start date is not on the actual month,
         * it doesn't take count of it
         */

        if (element.startDate >= thisMonthStart) {
          if (!element.endDate || element.endDate === '') {
            element.endDate = new Date();
          } else {
            element.endDate = new Date(element.endDate);
          }
          var listedMachines = machines.filter((machine) => {
            return machine.id === element.machineId;
          });

          /**
           * If the machine alreadly exist on machines array, we calculate
           * if the current history startDate overlap with one of the previous
           * history of this machine.
           */

          if (listedMachines.length === 0) {
            machines.push({
              id: element.machineId,
              type: element.machineType,
              start: [element.startDate],
              end: [element.endDate]
            });
          } else {

            /**
             * If no history overlaps with the current history, it pushes it to the
             * machine history array.
             */

            if (!_.some(listedMachines[0].start, (start, index) => {
              var diff = moment(listedMachines[0].end[index]).diff(moment(start), 'hours');
              if ((moment(listedMachines[0].end[index]).diff(moment(start), 'second') % 3600) !== 0) {
                diff += 1;
              }
              if (element.startDate < start.setHours(start.getHours() + diff)) {
                start.setHours(start.getHours() - diff);
                if (element.endDate > listedMachines[0].end[index]) {
                  listedMachines[0].end[index] = element.endDate;
                }
                return true;
              }
              start.setHours(start.getHours() - diff);
              return false;
            })) {
              listedMachines[0].start.push(element.startDate);
              listedMachines[0].end.push(element.endDate);
            }
          }
        }
      });
    })
    .then(() => {

      /**
       * Calcul the total hours used for all machines
       */

      machines.forEach((element) => {
        var totalDiff = 0;
        element.start.forEach((el, index) => {
          var start = moment(el);
          var end = moment(element.end[index]);
          totalDiff = totalDiff + end.diff(start, 'hours');
          if ((end.diff(start, 'second') % 3600) !== 0) {
            totalDiff += 1;
          }
        });

        duration.push({
          type: element.type,
          time: totalDiff
        });
      });
    })
    .then(() => {
      return duration;
    });
}

module.exports = {
  getUserHistory
};
