import Ember from 'ember';

export default Ember.Route.extend({

	afterModel() {
		this.toast.success("Account activated");
		this.transitionTo('login');
	},

	model(params) {
    console.log(params);
		return Ember.$.ajax({
			type: "PATCH",
			url: '/api/pendingusers/' + params.activate_id,
		})
		.then(null, (err) => {
			return err.responseJSON;
		});
	},
});
