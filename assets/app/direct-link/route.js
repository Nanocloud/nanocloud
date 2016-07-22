import Ember from 'ember';

export default Ember.Route.extend({

  queryParams: {
   app: {
      refreshModel: true
    }
  },

  beforeModel() {
    if (this.get('session.isAuthenticated') === false) {
      this.transitionTo('login');
    }
  },

  afterModel(user) {
    this.set('session.user', user);
  },

  model(params) {
    this.set('param', params.app);
    this.set('session.access_token', this.get('session.data.authenticated.access_token'));
    return this.store.queryRecord('user', { me: true });
  }
});
