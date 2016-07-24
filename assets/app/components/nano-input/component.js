import Ember from 'ember';

export default Ember.Component.extend({

  mode: null,
  placeholder: "",
  value: "",
  focus: false,
  type: "text",
  validation: null,

  didInsertElement() {
    if (this.get('autofocus') === true) {
      this.$().find('input').focus();
    }
  },

  init: function() {
    this._super(...arguments);
    var valuePath = this.get('valuePath');

    if (this.get('model')) {
      Ember.defineProperty(this, 'value', Ember.computed.alias(`model.${valuePath}`));
      Ember.defineProperty(this, 'validation', Ember.computed.oneWay(`model.validations.attrs.${valuePath}`));
    }
  },

  notValidating: Ember.computed.not('validation.isValidating'),
  hasContent: Ember.computed.notEmpty('value'),
  isValid: Ember.computed.and('hasContent', 'validation.isValid', 'notValidating'),
  isInvalid: Ember.computed('validation.isInvalid', 'hideError', function() {
    if (!this.get('hideError') && !this.get('hasContent')) {
      return false;
    }
    return this.get('validation.isInvalid');
  }),
  showMessage: Ember.computed.oneWay('isInvalid'),

  actions: {
    toggleFocus: function() {
      this.toggleProperty('focus');
    }
  }
});
