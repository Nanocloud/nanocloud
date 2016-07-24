import DS from 'ember-data';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';

export default DS.JSONAPIAdapter.extend(DataAdapterMixin, {

  // Tells ember-data to send user acecss_token alongside every requests
  authorizer: 'authorizer:oauth2',

  // All request to api will be made on HOST/api
  namespace: 'api'
});
