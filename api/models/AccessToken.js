var uuid = require('uuid');

module.exports = {

  attributes: {

    userId: {
      type: 'string',
      required: true
    },
    token: 'string',
    scope: 'string'

  },

  beforeCreate: function(values, next){
    values.token = uuid.v4();
    next();
  }

};
