/**
 * PendingUser.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const bcrypt = require("bcryptjs");
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
    firstName: {
      type: 'string'
    },
    lastName: {
      type: 'string'
    },
    hashedPassword: {
      type: 'string'
    },
    email: {
      type: 'string'
    },
    isAdmin: {
      type: 'boolean'
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.password;
      delete obj.hashedPassword;
      return obj;
    }
  },

  beforeCreate: function(values, next){
    var hash = bcrypt.hashSync(values.password, 10);
    values.hashedPassword = hash;
    delete values.password;
    next();
  }
};

