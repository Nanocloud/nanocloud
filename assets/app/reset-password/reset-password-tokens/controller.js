import Ember from 'ember';

export default Ember.Controller.extend({
	actions: {
		submitForm() {
			this.get('model')
			.save()
			.then(
				() => {
					this.toast.success("Your password has been updated.", "Please log in now");
					this.transitionToRoute('login');
				},
				(err) => {
					this.toast.error(err.errors[0].detail, "Please try again with another token.");
					return err.responseJSON;
				}
			);
		}
	}
});
