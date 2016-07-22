import DS from 'ember-data';

export default DS.Model.extend({
  type: DS.attr('string'),
  name: DS.attr('string'),
  size: DS.attr('number'),
  icon: function() {
    if (this.get('isDir')) {
      return ('folder');
    }
    return ('description');
  }.property(),
  isDir: function() {
    if (this.get('type') === 'directory') {
      return true;
    }
    return false;
  }.property(),
  isSelected: false,
});
