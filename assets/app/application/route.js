import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

export default Ember.Route.extend(ApplicationRouteMixin, {
  sessionInvalidated() {
    this.store.unloadAll();
    this.toast.info('Your session has ended.');
    this.transitionTo('login');
  },

  actions: {
    error(err) {
      if (err) {
        if (err.errors && err.errors.length) {
          err.errors.forEach((err) => {
            if (err.detail) {
              this.toast.error(err.detail, err.title);
            } else {
              this.toast.error(err.title);
            }
          });
        } else {
          throw err;
        }
      }
    }
  }
});
