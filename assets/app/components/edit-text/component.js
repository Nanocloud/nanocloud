import Ember from 'ember';
import TooltipsterComponent from 'ember-cli-tooltipster/components/tool-tipster';

export default TooltipsterComponent.extend({

    originalValue: "",
    errorMessage: null,
    isEditing: false,

    updateEditStateWatcher: function() {
      this.set('editStateWatcher', this.get('isEditing'));
      if (this.get('isEditing') === true) {
        this.set('content', null);
      }
      else {
        this.set('content', this.get('tooltip'));
      }
    }.observes('isEditing'),

    getInputType: function() {
      return this.get('type') || "text";
    }.property(),

    isValid: function() {
      return this.get('errorMessage');
    },

    autoSelectInput: function() {
      if (this.get('isEditing')) {
        Ember.run.scheduleOnce('afterRender', () => {
          this.$(this.get('element')).find('input').first().select();
        });
      }
    }.observes('isEditing'),

    setOriginalValue: function() {
      this.set('originalValue', this.get('textInput'));
    }.on('init'),

    actions: {

      toggle() {
        if (this.get('isEditing')) {
          this.set('textInput', this.get('originalValue'));
          this.set('errorMessage', "");
        }

        this.toggleProperty('isEditing');
      },

      submit() {
        var defer = Ember.RSVP.defer();

        defer.promise.then(() => {
          this.set('originalValue', this.get('textInput'));
          this.send('toggle');
        }, (err) => {
          this.set('errorMessage', err);
        });

        this.sendAction('onClose', defer);
      },

      cancel() {
        this.send('toggle');
      },
    }
});
