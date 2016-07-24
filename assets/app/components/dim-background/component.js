import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['dim-background'],
  classNameBindings: ['show:state-show:state-hide'],
  click: function() {
    if (!this.get('preventAction')) {
      this.sendAction();
    }
  },
});
