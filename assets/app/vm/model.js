import DS from 'ember-data';

export default DS.Model.extend({
  display_name: DS.attr('string'),
  status: DS.attr('string'),
  ico: DS.attr('string')
});
