import Ember from 'ember';

export default Ember.Controller.extend({

  session: Ember.inject.service('session'),

  loadState: {
    application: 0,
    user: 0,
    session: 0,
    machine: 0,
  },

  users: Ember.computed('model.users', 'model.users', function() {
    return this.get('model.users')
      .rejectBy('isAdmin', true);
  }),

  apps: Ember.computed('model.apps', 'model.apps', function() {
    return this.get('model.apps')
      .rejectBy('alias', 'Desktop');
  }),

  sessions: Ember.computed('model.sessions', 'model.sessions', function() {
    return this.get('model.sessions')
      .rejectBy('username', 'Administrator');
  }),

  machines: Ember.computed('model.machines', 'model.machines', function() {
    var machines = this.get('model.machines')
      .filterBy('status', 'up');
    return machines;
  }),

  activator: function() {
    this.loadData('app', 'apps');
    this.loadData('user', 'users');
    this.loadData('session', 'sessions');
    this.loadData('machine', 'machines');
  },

  loadData(data, dest) {
    this.set('loadState.' + data, 1);
    this.get('store').query(data, {})
      .then((response) => {
        this.set('loadState.' + data, 0);
        this.set('model.' + dest, response);
      })
      .catch(() => {
        this.set('loadState.' + data, 2);
      });
  },

  actions : {
    goToApps() {
      this.transitionToRoute('protected.apps');
    },
    goToUsers() {
      this.transitionToRoute('protected.users');
    },
    goToConnectedUsers() {
      this.transitionToRoute('protected.histories');
    },
    goToMachines() {
      this.transitionToRoute('protected.machines');
    },
  }
});
