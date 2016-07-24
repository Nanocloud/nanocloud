import VdiWindowComponent from '../vdi-window/component';

export default VdiWindowComponent.extend({

  actions: {
    clearList() {
      this.sendAction('flushHistory');
    },
  }
});

