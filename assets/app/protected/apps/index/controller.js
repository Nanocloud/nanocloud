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
    .launchVDI(this.get('model.alias'))
    .then(() => {
      let app = this.get('model');
      app.reload()
      .then(() => {
        app.set('state', 'running');
        app.save()
          .then(() => {
          })
          .catch(() => {
            this.toast.error("Cannot start application");
          })
          .finally(() => {
            this.set('remoteSession.plazaHasFinishedLoading', true);
          });
      });
    });
  }
});

export default Ember.Controller.extend({
  showSingleTab: false,
  showFileExplorer: false,
  connectionName: null,
  session: Ember.inject.service('session'),
  remoteSession: Ember.inject.service('remote-session'),
  configuration: Ember.inject.service('configuration'),
  isPublishing: false,
  isCheckingMachine: false,

  modelIsEmpty: Ember.computed.empty('items'),

  hasDesktop: Ember.computed('items', function() {
    var res = this.get('items').filterBy('alias', 'Desktop').get('length');
    return res > 0 ? true : false;
  }),

  sortableTableConfig: {

    filteringIgnoreCase: true,
    messageConfig: {
      searchLabel: "Search",
    },

    customIcons: {
      "sort-asc": "fa fa-caret-up",
      "sort-desc": "fa fa-caret-down",
      "caret": "fa fa-minus",
      "column-visible": "fa fa-minus",
    },

    customClasses: {
      "pageSizeSelectWrapper": "pagination-number"
    }
  },

  data : Ember.computed('items.@each', 'items', function() {

    const ret = Ember.A();
    const remoteSession = this.get('remoteSession');

    this.get('items').forEach((app) => {
      if (app.get('alias') !== 'Desktop') {
        ret.push(App.create({
          model: app,
          remoteSession: remoteSession,
          session: this.get('session'),
          controller: this
        }));
      }
    });
    return ret;
  }),

  columns: function() {

    return [
        {
          "propertyName": "name",
          "title": "Name",
          "disableFiltering": true,
          "filterWithSelect": false,
          "disableSorting": true,
          "template": "sortable-table/packages/name"
        },
    ];
  }.property(),

  launchVDI(connectionName) {

    return new Ember.RSVP.Promise((res, rej) => {

      this.set('isCheckingMachine', true);
      this.get('store').query('machines/user', {})
        .then((machines) => {
          if (machines.get('length') > 0) {
            this.get('remoteSession').one('connected', () => {
              res();
            });
            this.set('connectionName', connectionName);
            this.toggleProperty('showSingleTab');
          }
          else {
            this.toast.error("Could not find a virtual machine to start the VDI");
            rej();
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

    handleVdiClose() {
      this.get('remoteSession').disconnectSession(this.get('connectionName'));
      this.send('refreshModel');
    },

    startDesktop() {
      var list = this.get('items').filterBy('alias', 'Desktop');
      if (list.length === 1) {
        var app = list.objectAt(0);

        var desktop = App.create({
          model: app,
          remoteSession: this.get('remoteSession'),
          controller: this
        });
        desktop.launch();
      }
    }
  }
});
