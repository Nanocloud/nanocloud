import Ember from 'ember';

export default Ember.Mixin.create({
  themeService: Ember.inject.service('theme-service'),
  configService: Ember.inject.service('configuration'),
  applyTheme: function () {
    this._super();

    this.get('configService.deferred')
      .then(() => {
        let color = this.get('configService.primaryColor');
        Ember.run.next(this, function() {
          this.get('themeService').setupColor(color);
        });
      });

  },
});
