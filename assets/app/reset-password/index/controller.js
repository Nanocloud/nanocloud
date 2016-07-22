import Ember from 'ember';

export default Ember.Controller.extend({
  loadState: 0,

	actions: {
		submitForm() {
      this.set('loadState', 1);
			this.get('model')
			.save()
			.then(
				() => {
          this.set('loadState', 2);
					this.toast.success("Please check out you emails to reset your password", "Link sent");
					this.transitionToRoute('login');
				},
				(err) => {
          this.set('loadState', 0);
					this.toast.error(err.errors[0].title, "Password can not be reset");
					return err.responseJSON;
				}
			);
		}
	}
});
