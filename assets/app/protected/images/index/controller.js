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

let App = Ember.Object.extend({
  remoteSession: Ember.inject.service('remote-session'),
  model: null,

  id: Ember.computed('model.id', function() {
    return this.get('model.id');
  }),

  name: Ember.computed('model.displayName', function() {
    return this.get('model.displayName');
  }),

  launch() {
    this.set('remoteSession.plazaHasFinishedLoading', false);
    this.get('controller')
      .launchVDI(this.get('id'), this.get('image'))
      .then(() => {
        let app = this.get('model');
        app.reload()
          .then(() => {
            app.set('state', 'running');
            app.save()
              .catch((err) => {
                console.log(err);
                this.toast.error('Cannot start application');
              })
              .finally(() => {
                this.set('remoteSession.plazaHasFinishedLoading', true);
              });
          });
      })
      .catch((err) => {
        if (err === 'Exceeded credit') {
          this.toast.error('Exceeded credit');
        } else {
          this.send('error', err);
        }
      });
  }
});

function sortApps(apps) {
  /**
   * We need to sort apps by alphabetic order, but let desktop in first,
   * so we force the result of comparing with desktop, and let javascript
   * do the others comparason
   */
  apps.sort(function(app1, app2) {
    if (app1.get('name') === 'Desktop') {
      return -1;
    } else if (app2.get('name') === 'Desktop') {
      return 1;
    } else {
      return app1.get('name').localeCompare(app2.get('name'));
    }
  });
}

export default Ember.Controller.extend({
  showSingleTab: false,
  connectionName: null,
  session: Ember.inject.service('session'),
  remoteSession: Ember.inject.service('remote-session'),
  configuration: Ember.inject.service('configuration'),
  isCheckingMachine: false,

  modelIsEmpty: Ember.computed.empty('items'),

  data : Ember.computed('items.@each', 'items', function() {

    const ret = Ember.A();
    const remoteSession = this.get('remoteSession');

    this.get('items').forEach((image) => {
      const appRet = Ember.A();
      image.get('apps').forEach((app) => {
        appRet.push(App.create({
          model: app,
          remoteSession: remoteSession,
          session: this.get('session'),
          image: image.get('id'),
          controller: this
        }));
      });

      sortApps(appRet);
      ret.push({
        apps: appRet,
        name: image.get('name'),
        iaasId: image.get('iaasId'),
        createdAt: image.get('createdAt'),
        updatedAt: image.get('updatedAt'),
        buildFrom: image.get('buildFrom'),
        id: image.get('id'),
      });
    });

    return ret;
  }),

  launchVDI(appId, imageId) {
    return new Ember.RSVP.Promise((res, rej) => {

      this.set('isCheckingMachine', true);
      this.get('store').query('machines/user', {image: imageId})
        .then((machines) => {
          if (machines.get('length') > 0) {
            this.get('remoteSession').one('connected', () => {
              res();
            });
            this.set('connectionName', appId);
            this.transitionToRoute('vdi', {
              queryParams: {
                connection_name: this.get('connectionName'),
                machine_id: machines.objectAt(0).get('id'),
                image_id: imageId
              }
            });
          }
          else {
            this.toast.error('Could not find a virtual machine to start the VDI');
            rej();
          }
        })
        .catch((err) => {
          if (err.errors && err.errors[0].status === '402') {
            this.toast.error('Credit exceeded');
          } else {
            this.send('error', err);
          }
        })
        .finally(() => {
          this.set('isCheckingMachine', false);
        });
    });
  },

  actions: {

    retryConnection() {
      this.toggleProperty('activator');
    },

    startDesktop() {
      var list = this.get('items').filterBy('alias', 'Desktop').filterBy('image.default', true);
      if (list.length === 1) {
        var app = list.objectAt(0);

        var desktop = App.create({
          model: app,
          remoteSession: this.get('remoteSession'),
          controller: this
        });
        desktop.launch();
      }
    },

    handleVdiClose() {
      this.get('remoteSession').disconnectSession(this.get('connectionName'));
      this.send('refreshModel');
    },
  }
});
