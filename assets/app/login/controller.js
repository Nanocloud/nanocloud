import Ember from 'ember';

export default Ember.Controller.extend({
  identification: '',
  password: '',
  configuration: Ember.inject.service('configuration'),

  reset() {
    this.setProperties({
      identification: '',
      password: ''
    });
  },

  actions: {
    authenticate() {
      let { identification, password } = this.getProperties('identification', 'password');

      this.get('session')
      .authenticate(
        'authenticator:oauth2',
        identification,
        password
      ).catch(() => {
        this.toast.error("Invalid credentials");
      });
    }
  }
});
