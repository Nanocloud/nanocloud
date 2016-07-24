import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('protected', { path: '/' }, function() {
    this.route('users', function() {
      this.route('user', { path: '/:user_id' });
      this.route('new');
      this.route('users.new');
      this.route('groups', function() {
        this.route('group', { path: '/:group_id' }, function() {
          this.route('members');
          this.route('apps');
        });
        this.route('new');
      });
    });
    this.route('machines', function() {
      this.route('user');
      this.route('new');
      this.route('machine', { path: '/:machine_id' });
    });
    this.route('apps', function() {
      this.route('app', { path: '/:app_id' });
    });
    this.route('apps');
    this.route('files', function() {
      this.route('nowindows');
    });
    this.route('histories', function() {});
    this.route('dashboard');
    this.route('configs', function() {
      this.route('user-right');
      this.route('email-configuration');
      this.route('other-setting');
      this.route('look-and-feel');
    });
  });

  this.route('login');
  this.route('direct-link');
  this.route('activate');
  this.route('sign-up');
  this.route('reset-password', function() {
      this.route('reset-password-tokens', { path: '/:reset-password-token_id' });
  });
});

export default Router;
