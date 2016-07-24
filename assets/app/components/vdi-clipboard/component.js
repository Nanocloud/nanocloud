import Ember from 'ember';
import VdiWindowComponent from '../vdi-window/component';

export default VdiWindowComponent.extend({

  remoteSession: Ember.inject.service('remote-session'),
  localClipboardContent: null,

  updateCloudClipboardOnTyping: function() {
    this.get('remoteSession').setCloudClipboard(this.get('connectionName'), this.get('cloudClipboardContent'));
  }.observes('cloudClipboardContent'),

  init: function() {
    this._super(...arguments);
    var connectionName = this.get('connectionName');
    Ember.defineProperty(this, 'localClipboardContent', Ember.computed.alias(`remoteSession.openedGuacSession.${connectionName}.localClipboard`));
    Ember.defineProperty(this, 'cloudClipboardContent', Ember.computed.alias(`remoteSession.openedGuacSession.${connectionName}.cloudClipboard`));
  },


  actions: {

    savePasteToLocal() {
      this.get('remoteSession').setLocalClipboard(this.get('connectionName'), this.get('cloudClipboardContent'));
      Ember.$('.vdi-clipboard .done-msg').css('opacity', 0);
      Ember.$('.vdi-clipboard .done-msg')
        .velocity("stop")
        .velocity({ opacity: 1}, {
        duration: 400,
        complete: function() {
          setTimeout(function() {
            Ember.$('.vdi-clipboard .done-msg').velocity({ opacity: 0}, {
              duration: 400,
            });
          }, 4000);
        }
      });
    },

    clearClipboard() {
      this.set('cloudClipboardContent', '');
    }
  }
});

