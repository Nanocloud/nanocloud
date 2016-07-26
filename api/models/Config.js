/**
 * Config.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  autoPK: false,
  attributes: {

    key: {
      type: 'string',
      primaryKey: true,
      unique: true,
      index: true
    },

    value: {
      type: 'string'
    }
  }
};
