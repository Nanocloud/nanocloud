import Ember from 'ember';

export default Ember.Controller.extend({

  machinesController: Ember.inject.controller('protected.machines'),
  drivers: Ember.computed.alias('machinesController.drivers'),
  selectedItem: null,

  reset: function() {
    this.setProperties({
      machineName: '',
    });
  },

  actions: {

    selectItem(item) {
      this.set('selectedItem', item);
    },

    createMachine() {
      let type;
      let driver = this.get('drivers').objectAt(0);
      driver.get('types').forEach((item) => {
        if (this.get('selectedItem') === item.id) {
          type = item;
        }
      });
      if (!this.machineName) {
        this.toast.error("Insert a machine name");
        return;
      }
      if (!type) {
        this.toast.error("Select an instance type");
        return;
      }

      let m = this.store.createRecord('machine', {
        name: this.get('machineName'),
        type: type,
        driver: driver
      });

      m.save()
      .then((machine) => {
        this.transitionToRoute('protected.machines.machine', machine);
      });
    }
  }
});
