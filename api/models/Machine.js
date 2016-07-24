/**
 * Machine.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string'
    },
    type: {
      type: 'string'
    },
    ip: {
      type: 'string'
    },
    status: {
      type: 'string'
    },
    adminPassword: {
      type: 'string'
    },
    platform: {
      type: 'string'
    }
  }
};
