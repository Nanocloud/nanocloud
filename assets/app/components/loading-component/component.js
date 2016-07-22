import Ember from 'ember';

export default Ember.Component.extend({

  dots: Ember.computed('size', function() {
    var arr = Ember.A([]);
    let size = this.get('size') ? this.get('size') : 3;
    for ( var i = 0; i < size; i++) {
      arr.pushObject(0);
    }
    return arr;
  })
});
