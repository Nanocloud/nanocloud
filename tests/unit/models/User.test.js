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

// jshint mocha:true

/* global History, User */

describe('User Service', () => {
  let adminUser = null;

  describe('getUserHistory', () => {
    before('Clean History database', function(done) {
      History.query('TRUNCATE TABLE public.history', () => {});
      User.findOne({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      })
        .then((user) => {
          adminUser = user;
          return done();
        });
    });

    it('Should return an empty array', (done) => {
      adminUser.getHistory('aws')
        .then((his) => {
          if (his.length !== 0) {
            return done(new Error('History should be empty'));
          } else {
            this.newDate = new Date();
            this.newDate.setDate(this.newDate.getDate() + 1);
            this.newDate.setHours(0);
            this.newDate.setMinutes(5);
            return History.create([{
              userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              connectionId: 'Desktop',
              startDate: this.newDate.toString(),
              endDate: '',
              createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
              updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
              machineId: 'g5362974-a8df-4ed6-89f5-99093b145999',
              machineDriver: 'aws',
              machineType: 't2.medium'
            },
            {
              userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              connectionId: 'Desktop',
              startDate: 'Wed Jun 27 14:08:05 UTC 2016',
              endDate: '',
              createdAt: 'Wed Jun 20 10:00:00 UTC 2016',
              updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
              machineId: 'g5362974-a8df-4ed6-89f5-99093b145999',
              machineDriver: 'aws',
              machineType: 't2.medium'
            }])
              .then(() => {
                return done();
              });
          }
        });
    });

    it('Should return a valid timer', (done) => {

      adminUser.getHistory('aws')
        .then((his) => {
          if (his.length !== 1) {
            return done(new Error('It should found an history'));
          } else if (!his[0].time) {
            return done(new Error('Bad time returned'));
          } else {
            History.destroy({
              machineId: 'g5362974-a8df-4ed6-89f5-99093b145999'
            })
              .then(() => {
                var end = new Date();
                end.setDate(end.getDate() + 1);
                end.setHours(1);
                end.setMinutes(0);
                History.create({
                  userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
                  connectionId: 'Desktop',
                  startDate: this.newDate.toString(),
                  endDate: end.toString(),
                  createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
                  updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
                  machineId: 'f5362974-a8df-4ed6-89f5-99093b145999',
                  machineDriver: 'aws',
                  machineType: 't2.medium'
                }, done);
              });
          }
        });
    });

    it('Should return correct history timer', (done) => {
      adminUser.getHistory('aws')
        .then((his) => {
          if (his.length !== 1) {
            return done(new Error('It should found an history'));
          } else if (his[0].type !== 't2.medium') {
            return done(new Error('Bad type returned'));
          } else if (his[0].time !== 1) {
            return done(new Error('Bad time returned'));
          } else {
            var end = new Date();
            end.setDate(end.getDate() + 1);
            end.setHours(1);
            end.setMinutes(0);
            return History.create({
              userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              connectionId: 'Desktop',
              startDate: this.newDate.toString(),
              endDate: end.toString(),
              createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
              updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
              machineId: 'f5862974-g8df-4ed6-89f5-99093b145996',
              machineDriver: 'aws',
              machineType: 't2.small'
            });
          }
        })
        .then(() => {
          return adminUser.getHistory('aws');
        })
        .then((his) => {
          if (his.length !== 2) {
            return done(new Error('Bad number of machine history returned'));
          } else if (his[1].time !== 1) {
            return done(new Error('Bad timer returned for the second machine'));
          } else if (his[1].type !== 't2.small') {
            return done(new Error('Bad type returned'));
          } else {
            var start2 = new Date();
            var start3 = new Date();
            var end = new Date();
            var end2 = new Date();
            var end3 = new Date();

            start2.setDate(start2.getDate() + 1);
            start2.setHours(2);
            start2.setMinutes(5);
            start3.setDate(start3.getDate() + 1);
            start3.setHours(5);
            start3.setMinutes(5);
            end.setHours(1);
            end.setDate(end.getDate() + 1);
            end.setMinutes(0);
            end2.setHours(4);
            end2.setDate(end2.getDate() + 1);
            end2.setMinutes(0);
            end3.setHours(8);
            end3.setDate(end3.getDate() + 1);
            end3.setMinutes(0);

            return History.create([{
              userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              connectionId: 'Desktop',
              startDate: this.newDate.toString(),
              endDate: end.toString(),
              createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
              updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
              machineId: 'f5862974-g8df-4ed6-89f5-99093b145996',
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
              machineId: 'f5862974-g8df-4ed6-89f5-99093b145996',
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
              machineId: 'f5862974-g8df-4ed6-89f5-99093b145996',
              machineDriver: 'aws',
              machineType: 't2.small'
            },
            {
              userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              connectionId: 'Desktop',
              startDate: this.newDate.toString(),
              endDate: end.toString(),
              createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
              updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
              machineId: 'f5362974-a8df-4ed6-89f5-99093b145999',
              machineDriver: 'aws',
              machineType: 't2.medium'
            }]);
          }
        })
        .then(() => {
          return adminUser.getHistory('aws');
        })
        .then((his) => {
          if (his.length !== 2) {
            return done(new Error('Bad number of machine history returned'));
          } else if (his[0].time !== 1 || his[1].time !== 6) {
            return done(new Error('Bad timer returned'));
          } else {
            done();
          }
        });
    });
  });
});
