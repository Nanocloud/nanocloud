import Ember from 'ember';
import TooltipsterComponent from 'ember-cli-tooltipster/components/tool-tipster';

export default TooltipsterComponent.extend({
  classNames: ['icon-component'],
  classNameBindings: [
    'hover-enabled:hover-enabled',
    'clickable:clickable'
  ],

  didInsertElement() {
    Ember.$(this.get('element')).find('.icon-element').css('font-size', this.get('size'));
  },

  actions: {
    clickAction() {
      this.sendAction("click");
    }
  }
});
