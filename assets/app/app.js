import Ember from 'ember';
import config from 'nanocloud/config/environment';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';

let App;

Ember.MODEL_FACTORY_INJECTIONS = true;

Ember.libraries.register(config.APP.name, config.APP.version);

App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver
});

loadInitializers(App, config.modulePrefix);

export default App;
