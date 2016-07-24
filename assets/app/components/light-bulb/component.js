import Ember from 'ember';
import TooltipsterComponent from 'ember-cli-tooltipster/components/tool-tipster';

export default TooltipsterComponent.extend({
  classNames: ['light-bulb'],

  currentStatus: Ember.computed('status', function() {
    var status = this.get('status');
    return status ? status : "online";
  })
});
