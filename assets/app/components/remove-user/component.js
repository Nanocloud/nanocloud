import Ember from 'ember';

export default Ember.Component.extend({

	removeConfirmation: null,

	actions: {

		removeAccountConfirm: function() {
			this.set("removeConfirmation", true);
		},

		cancelAccountConfirm: function() {
			this.set("removeConfirmation", false); 
		},

		removeAccount: function() {
			this.sendAction();
		}
	}
});
