import Ember from 'ember';

export default Ember.Route.extend({
	queryParams: {
    token: {
      refreshModel: true
    }
  },

	afterModel() {
		this.toast.success("Account activated");
		this.transitionTo('login');
	},

	model(params) {
		return Ember.$.ajax({
			type: "PATCH",
			url: '/api/users/' + params.token,
			data: {
				token: params.token
			}
		})
		.then(null, (err) => {
			return err.responseJSON;
		});
	},
});
