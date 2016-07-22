import Ember from 'ember';

export default Ember.Service.extend({
  store: Ember.inject.service('store'),
  session: Ember.inject.service('session'),
  keyToBeRetrieved: [
    "autoRegister",
    "autoLogoff",
    "sessionDuration",
    "smtpServerHost",
    "smtpServerPort",
    "expirationDays",
    "smtpLogin",
    "smtpPassword",
    "smtpSendFrom",
    "host",
    "defaultGroup",
    "awsCache",
    "customTitle",
    "customFavIconPath",
    "customLogoPath",
    "customPrimaryColor"
  ],
  keyToBeRetrievedAsString: Ember.computed('keyToBeRetrieved', function() {
    let params = this.get('keyToBeRetrieved');
    let data = "";
    for ( var property in params ) {
      if (params.hasOwnProperty(property)) { 
        data += params[property] + ",";
      }
    }
    return data;
  }),

  loadData() {
    var promise = this.set('deferred', this.get('store').query('config', { key: this.get('keyToBeRetrievedAsString') }));
    promise.then((res) => {
      res.forEach((item) => {
        var val = item.get('value');
        if (val === 'true' || val === 'false') {
          val = (val === 'true');
        }
        this.set(item.get('key'), val);
      });
    });
    return promise;
  },

  getValue(key) {
    var res = this.get('deferred')
      .filterBy('key', key)
      .objectAt(0);
    if (res) {
      return res.get('value') || "";
    }
    return "";
  },

  saveData(key, value) {
    return this.get('store').createRecord('config', { key: key, value: value }).save();
  },
});
