import Ember from 'ember';

export default Ember.Controller.extend({
  store: Ember.inject.service('store'),
  configuration: Ember.inject.service('configuration'),
  isEditing: false,
  loadState: false,
  loadInputs() {
    this.get('configuration.deferred')
      .then(() => {
        var params = this.get('configuration.keyToBeRetrieved');
        for (var property in params) {
          if (params.hasOwnProperty(property)) {
            this.set(params[property], this.get('configuration.' + params[property]));
            Ember.defineProperty(this, params[property], Ember.computed.alias('configuration.' + params[property]));
            this.addObserver(params[property], this.saveKey);
          }
        }
        this.set('loadState', true);
      });
  },

  unselectGroupWhenAutoRegisterIsOff: function() {
    if (this.get('loadState') === true) {
      if (this.get('autoRegister') === false) {
        this.set('defaultGroup', null);
        this.saveKey(null, 'defaultGroup');
      }
    }
  }.observes('autoRegister'),

  saveKey(sender, key) {
    this.get('configuration').saveData(key, this.get(key))
    .then(() => {
        this.toast.success('Configuration has been saved.');
      })
    .catch(() => {
      this.toast.error('Configuration could not be saved.');
    });
  },

  init() {
    this._super(...arguments);
    this.loadInputs();
  },

  actions: {
    selectGroup(id) {
      if (this.get('defaultGroup') === id) {
        this.set('defaultGroup', null);
      }
      else {
        this.set('defaultGroup', id);
      }
      this.saveKey(null, 'defaultGroup');
    },
  }
});
