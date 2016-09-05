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

/* global History, User */

const DummyDriver = require('../../../api/drivers/dummy/driver');
let _driver = null;

process.env.iaas = 'dummy';
process.env.machinePoolSize = 3;
process.env.sessionDuration = 0;

describe('Dummy driver', () => {
  let adminUser = null;
  describe('getUserCredit', () => {
    before('clean history database', (done) => {
      History.query('DELETE FROM public.history', (err) => {
        if (err) {
          done(err);
          return ;
        }

        _driver = new DummyDriver();
        _driver.initialize()
        .then(() => {
          return User.findOne({
            id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
          })
            .then((user) => {
              adminUser = user;
              done();
            });
        })
        .catch(done);
      });
    });

    it('Should return 0', (done) => {
      _driver.getUserCredit(adminUser)
        .then((price) => {
          if (price !== 0) {
            return done(new Error('Bad price returned'));
          } else {
            done();
          }
        });
    });

    it('Should return a coherent price', (done) => {
      var start = new Date();
      var end = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(0);
      start.setMinutes(5);
      end.setDate(end.getDate() + 1);
      end.setHours(1);
      end.setMinutes(0);
      History.create({
        userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
        connectionId: 'Desktop',
        startDate: start.toString(),
        endDate: end.toString(),
        createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
        updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
        machineId: 'f5362974-a8df-4ed6-89f5-99093b145999',
        machineDriver: 'aws',
        machineType: 't2.small'
      })
        .then(() => {
          return _driver.getUserCredit(adminUser);
        })
        .then((price) => {
          if (price !== 0.04) {
            return done(new Error('Bad price returned'));
          } else {
            done();
          }
        });
    });

    it('Should return a coherent price', (done) => {
      var start = new Date();
      var start2 = new Date();
      var start3 = new Date();
      var end = new Date();
      var end2 = new Date();
      var end3 = new Date();

      start.setDate(start.getDate() + 1);
      start.setHours(0);
      start2.setDate(start2.getDate() + 1);
      start2.setHours(2);
      start3.setHours(5);
      start.setMinutes(5);
      start3.setDate(start3.getDate() + 1);
      start2.setMinutes(5);
      start3.setMinutes(5);
      end.setDate(end.getDate() + 1);
      end.setHours(1);
      end2.setDate(end2.getDate() + 1);
      end2.setHours(4);
      end3.setHours(8);
      end.setMinutes(0);
      end3.setDate(end3.getDate() + 1);
      end2.setMinutes(0);
      end3.setMinutes(0);

      History.create([{
        userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
        connectionId: 'Desktop',
        startDate: start.toString(),
        endDate: end.toString(),
        createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
        updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
        machineId: 'f5362974-a8df-4ed6-89f5-99093b145999',
        machineDriver: 'aws',
        machineType: 't2.small'
      },
      {
        userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
        connectionId: 'Desktop',
        startDate: start2.toString(),
        endDate: end2.toString(),
        createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
        updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
        machineId: 'f5362974-o6er-4ed6-89f5-99093b145999',
        machineDriver: 'aws',
        machineType: 't2.small'
      },
      {
        userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
        connectionId: 'Desktop',
        startDate: start3.toString(),
        endDate: end3.toString(),
        createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
        updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
        machineId: 'f5362974-o6er-4ed6-89f5-99093b145999',
        machineDriver: 'aws',
        machineType: 't2.small'
      }])
        .then(() => {
          return _driver.getUserCredit(adminUser);
        })
        .then((price) => {
          if (price !== (6 * 0.04)) {
            return done(new Error('Bad price returned'));
          } else {
            done();
          }
        })
        .catch(done);
    });
  });
});
