import Ember from 'ember';

export default Ember.Controller.extend({
  loadState: false,
  user: Ember.computed('model.users', function(){
		var user = this.get('model.users');
		return user ? user.objectAt(0) : null;
  }),

  displayCountdown: Ember.computed('model.countdownTimeleft', function() {
    return this.get('model.countdownTimeleft') > 0 ? true : false;
  }),

  controlsSupported: ['qemu','manual'],
  controlsAreSupported: Ember.computed('model.getPlatform', 'controlsSupported', function() {
    var ret = this.get('controlsSupported').indexOf(this.get('model.platform'));
    return ret === -1 ? false : true;
  }),

  machineName: Ember.computed('model.name', function() {
    return this.get('model.name') ? this.get('model.name') : "Machine";
  }),

  startMachine() {
    let machine = this.get('model');

    machine.set('status', 'up');
    machine.save();
  },

  stopMachine() {
    let machine = this.get('model');

    machine.set('status', 'down');
    machine.save();
  },

  rebootMachine() {
    let machine = this.get('model');
    this.set('loadState', true);
    machine.set('status', 'reboot');
    machine.save()
      .then(() => {
        this.toast.success("Machine has been rebooted");
      })
      .catch(() => {
        this.toast.error("Machine could not be rebooted");
      })
      .finally(() => {
        this.set('loadState', false);
      });
  },

  terminateMachine() {
    let machine = this.get('model');

    machine.destroyRecord();
    this.transitionToRoute('protected.machines');
  },

  actions: {
    startMachine() {
      this.startMachine();
    },

    stopMachine() {
      this.stopMachine();
    },

    rebootMachine() {
      this.rebootMachine();
    },

    terminateMachine() {
      this.terminateMachine();
    }
  }
});

