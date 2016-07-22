import Ember from 'ember';

export default Ember.Component.extend({

  actions: {
    clickPath(index) {
      this.get('clickOnPath')(index);
    }
  },
});
