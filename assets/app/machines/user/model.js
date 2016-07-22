import DS from 'ember-data';

export default DS.Model.extend({
  
  machines: DS.belongsTo('machine'),
});
