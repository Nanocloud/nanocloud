const uuid = require('node-uuid');

module.exports = {

  autoPK: false,

  attributes: {
    id: {
      type: 'string',
      primaryKey: true,
      unique: true,
      index: true,
      uuidv4: true,
      defaultsTo: function (){ return uuid.v4(); }
    },
    email: {
      type: 'string'
    }
  }
};

