import Ember from 'ember';

export default Ember.Component.extend({

  classNames: ["card-component"],

  actions: {
    clickOnContent() {
      this.sendAction('clickOnContent');
    }
  }
});
