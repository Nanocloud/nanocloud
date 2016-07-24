import Ember from 'ember';

export default Ember.Controller.extend({
  loadState: 0,

	actions: {
		submitForm() {
      this.set('loadState', 1);
			this.get('model')
			.save()
			.then(() => {
        this.set('loadState', 2);
				this.toast.success("Please check out your mails to activate your account", "Account created");
				Ember.run.later((() => {
					this.transitionToRoute('login');
				}), 0);
			})
			.catch((err) => {
          this.set('loadState', 0);
					this.toast.error(err.errors[0].detail, "Account not created");
					return err.responseJSON;
				}
			);
		}
	}
});
