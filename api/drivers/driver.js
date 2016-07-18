/* jshint unused:vars */

module.exports = {

  /*
   * Method to be executed when driver is loaded
   *
   * @method init
   * @param {function} callback to call when init is done
   */
  init: function(done) {
    sails.log.verbose("Driver's init method not implemented");
  },

  /*
   * Return list of machines
   *
   * @method find
   * @param {function} callback to call one find is done
   * @return {array} Array of model Machine
   */
  find: function(done) {
    throw new Error("Driver's method 'find' not implemented");
  },

  /*
   * Return list of machines
   *
   * @method create
   * @param {object} Machine model to be created
   * @param {function} callback to call one find is done
   * @return {object} Machine model created
   */
  create: function(data, done) {
    throw new Error("Driver's method 'create' not implemented");
  }
};
