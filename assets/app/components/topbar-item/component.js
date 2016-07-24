import TooltipsterComponent from 'ember-cli-tooltipster/components/tool-tipster';

export default TooltipsterComponent.extend({

  classNameBindings: ['stateEnabled'],

  timer: 500,

  actions: {
    clickAction() {
      this.sendAction("click");
    }
  }
});
