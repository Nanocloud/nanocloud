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

/* global UserService, History */

describe('User Service', () => {
  describe('getUserHistory', () => {
    before('Clean History database', function(done) {
      History.query('TRUNCATE TABLE public.history', done);
    });

    it('Should return an empty array', (done) => {
      UserService.getUserHistory({
        user: {
          id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
        }
      }, 'aws')
        .then((his) => {
          if (his.length !== 0) {
            return done(new Error('History should be empty'));
          } else {
            return History.create({
              userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              connectionId: 'Desktop',
              startDate: 'Wed Jul 27 14:08:05 UTC 2016',
              endDate: 'Wed Jul 27 14:53:15 UTC 2016',
              createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
              updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
              machineId: 'f5362974-a8df-4ed6-89f5-99093b145999',
              machineDriver: 'aws',
              machineType: 't2.medium'
            }, done);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });

    it('Should return correct history timer', (done) => {
      return UserService.getUserHistory({
        id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      }, 'aws')
        .then((his) => {
          if (his.length !== 1) {
            return done(new Error('It should found an history'));
          } else if (his[0].type !== 't2.medium') {
            return done(new Error('Bad type returned'));
          } else if (his[0].time !== 1) {
            return done(new Error('Bad time returned'));
          } else {
            return History.create({
              userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              connectionId: 'Desktop',
              startDate: 'Wed Jul 27 14:08:05 UTC 2016',
              endDate: 'Wed Jul 27 15:09:15 UTC 2016',
              createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
              updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
              machineId: 'f5862974-g8df-4ed6-89f5-99093b145996',
              machineDriver: 'aws',
              machineType: 't2.small'
            });
          }
        })
        .then(() => {
          return UserService.getUserHistory({
            id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
          }, 'aws');
        })
        .then((his) => {
          if (his.length !== 2) {
            return done(new Error('Bad number of machine history returned'));
          } else if (his[1].time !== 2) {
            return done(new Error('Bad timer returned for the second machine'));
          } else if (his[1].type !== 't2.small') {
            return done(new Error('Bad type returned'));
          } else {
            return History.create([{
              userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              connectionId: 'Desktop',
              startDate: 'Wed Jul 27 15:10:05 UTC 2016',
              endDate: 'Wed Jul 27 15:35:15 UTC 2016',
              createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
              updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
              machineId: 'f5862974-g8df-4ed6-89f5-99093b145996',
              machineDriver: 'aws',
              machineType: 't2.small'
            },
            {
              userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
              connectionId: 'Desktop',
              startDate: 'Wed Jul 27 16:08:05 UTC 2016',
              endDate: 'Wed Jul 27 18:09:15 UTC 2016',
              createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
              updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
              machineId: 'f5862974-g8df-4ed6-89f5-99093b145996',
              machineDriver: 'aws',
              machineType: 't2.small'
            }]);
          }
        })
        .then(() => {
          return UserService.getUserHistory({
            id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
          }, 'aws');
        })
        .then((his) => {
          if (his.length !== 2) {
            return done(new Error('Bad number of machine history returned'));
          } else if (his[0].time !== 1 || his[1].time !== 5) {
            return done(new Error('Bad timer returned'));
          } else {
            done();
          }
        })
        .catch((err) => {
          console.log(err);
          throw new Error('Bad request');
        });

    });
  });
});
