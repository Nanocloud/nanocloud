import Ember from 'ember';
import VdiWindowComponent from '../vdi-window/component';

export default VdiWindowComponent.extend({

  classNames: ['vdi-packaging'],
  store: Ember.inject.service('store'),

  actions: {
    savePackage() {
      var _package = this.get('store').createRecord('app', {
        displayName: this.get('packageName'),
        alias: this.get('packageName')
      });
      _package.save()
        .then(() => {
          console.log('suvbmit ok!');
          this.sendAction('hasFinished');
        });
    }  
  }
});
