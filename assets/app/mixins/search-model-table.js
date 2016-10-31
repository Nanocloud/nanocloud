import Ember from 'ember';

export default Ember.Mixin.create({

  init() {
    this._super(...arguments);
    Ember.run.scheduleOnce('afterRender', () => {
      Ember.$('.globalSearch').hide();
    });
  },

  actions: {
    toggleSearchModelTable() {
      Ember.$('.globalSearch').toggle();
    }
  }
});
