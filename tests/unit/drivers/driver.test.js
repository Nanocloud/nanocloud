/**
 * nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
 *
 * copyright (c) 2016 nanocloud software
 *
 * this file is part of nanocloud.
 *
 * nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the gnu affero general public license as
 * published by the free software foundation, either version 3 of the
 * license, or (at your option) any later version.
 *
 * nanocloud is distributed in the hope that it will be useful,
 * but without any warranty; without even the implied warranty of
 * merchantability or fitness for a particular purpose.  see the
 * gnu affero general public license for more details.
 *
 * you should have received a copy of the gnu affero general
 * public license
 * along with this program.  if not, see
 * <http://www.gnu.org/licenses/>.
 */

// jshint mocha:true

/* global History, ConfigService */

const AWSDriver = require('../../../api/drivers/aws/driver');
const fs = require("fs");
let _driver = null;

process.env.iaas = 'dummy';
process.env.machinePoolSize = 3;
process.env.sessionDuration = 0;

describe('aws driver', () => {
  describe('getusercredit', () => {
    before('clean history database', function(done) {
      History.query('TRUNCATE TABLE public.history', () => {
        fs.readFile("./tests/unit/drivers/fakePrice.json", (err, data) => {
          ConfigService.set('price', data.toString())
            .then(() => {
              _driver = new (AWSDriver)();
              done();
            })
            .catch(() => {
              console.log(err);
            });
        });
      });
    });

    it('Should return 0', (done) => {
      _driver.getUserCredit({
        id : 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
      }, 'aws')
        .then((price) => {
          if (price !== 0) {
            return done(new Error('Bad price returned'));
          } else {
            done();
          }
        })
        .catch((err) => {
          return done(new Error(err));
        });
    });

    it('Should return a coherent price', (done) => {
      History.create({
        userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
        connectionId: 'Desktop',
        startDate: 'Wed Jul 27 14:08:05 UTC 2016',
        endDate: 'Wed Jul 27 14:53:15 UTC 2016',
        createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
        updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
        machineId: 'f5362974-a8df-4ed6-89f5-99093b145999',
        machineDriver: 'aws',
        machineType: 't2.small'
      })
        .then(() => {
          return _driver.getUserCredit({
            id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
          }, 'aws');
        })
        .then((price) => {
          if (price !== 0.04) {
            return done(new Error('Bad price returned'));
          } else {
            done();
          }
        })
        .catch((err) => {
          return done(new Error(err));
        });
    });

    it('Should return a coherent price', (done) => {
      History.create({
        userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
        connectionId: 'Desktop',
        startDate: 'Wed Jul 27 15:00:05 UTC 2016',
        endDate: 'Wed Jul 27 15:15:15 UTC 2016',
        createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
        updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
        machineId: 'f5362974-a8df-4ed6-89f5-99093b145999',
        machineDriver: 'aws',
        machineType: 't2.small'
      })
        .then(() => {
          return History.create({
            userId: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
            connectionId: 'Desktop',
            startDate: 'Wed Jul 27 15:00:05 UTC 2016',
            endDate: 'Wed Jul 27 15:15:15 UTC 2016',
            createdAt: 'Wed Jul 27 14:07:15 UTC 2016',
            updatedDate: 'Wed Jul 27 14:53:15 UTC 2016',
            machineId: 'f5362974-o6er-4ed6-89f5-99093b145999',
            machineDriver: 'aws',
            machineType: 't2.small'
          });
        })
        .then(() => {
          return _driver.getUserCredit({
            id: 'aff17b8b-bf91-40bf-ace6-6dfc985680bb'
          }, 'aws');
        })
        .then((price) => {
          if (price !== (3 * 0.04)) {
            return done(new Error('Bad price returned'));
          } else {
            done();
          }
        })
        .catch((err) => {
          return done(new Error(err));
        });
    });
  });
});
