import DS from 'ember-data';

export default DS.Model.extend({
  key: DS.attr('string'),
  content: DS.attr('string'),
  subject: DS.attr('string'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
});
