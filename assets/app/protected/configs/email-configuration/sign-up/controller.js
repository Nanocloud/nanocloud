import Ember from 'ember';

export default Ember.Controller.extend({

  actions: {
    textChanged(newValue) {
      this.set('template', newValue);
    },

    saveChanges() {
      let data = this.get('template');
      data = data.split(/\[/).join('{').split(/\]/).join('}');

      let model = this.get('model');
      model.set('content', data);

      model.save()
        .then(() => {
          this.toast.success('Activation email template has been updated successfully.');
        })
        .catch(() => {
          this.toast.success('Activation email template could not be updated.');
        });
    }
  }
});
