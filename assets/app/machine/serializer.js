import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
  attrs: {
    "users" : { serialize: false }
  }
});
