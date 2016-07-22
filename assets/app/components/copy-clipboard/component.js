import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    copyTextToClipboard(text) {
      var textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.toast.success(this.get('title') + ' has been copied');
    }
  }
});
