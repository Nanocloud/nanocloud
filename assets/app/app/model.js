import DS from 'ember-data';
import {validator, buildValidations} from 'ember-cp-validations';

const Validations = buildValidations({
  displayName: [
    validator('presence', true),
    validator('length', {
      min: 2,
      max: 255
    })
  ]
});

export default DS.Model.extend(Validations, {
  state: DS.attr('string'),
  publicationDate: DS.attr('string'),
  groups: DS.hasMany('group'),
  alias: DS.attr('string'),
  collectionName: DS.attr('string'),
  displayName: DS.attr('string'),
  filePath: DS.attr('string'),
  iconContent: DS.attr('string'),
  path: DS.attr('string'),
});
