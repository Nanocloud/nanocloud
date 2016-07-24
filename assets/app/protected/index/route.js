import Ember from 'ember';

export default Ember.Route.extend({
  redirect() {

    if (this.get('session.isAuthenticated') === true && !this.get('directLinkParams')) {

      if (this.get('session.user.isAdmin')) {
        this.transitionTo('protected.dashboard');
      }
      else {
        this.transitionTo('protected.apps');
      }
    }
  },
});
