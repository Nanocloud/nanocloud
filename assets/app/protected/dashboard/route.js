import Ember from 'ember';

export default Ember.Route.extend({

  model() {
    this.controllerFor('protected.dashboard').activator();
    return Ember.RSVP.hash({
      apps: [],
      users: [],
      sessions: [],
      machines: [],
    });
  },
});
