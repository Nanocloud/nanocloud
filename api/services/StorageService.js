/* globals Storage */

const randomstring = require("randomstring");

module.exports = {

  _initialized: true,

  /**
   * findOrCreate
   *
   * Find or create a user storage in database
   *
   * @user {user}
   * @return {UserStorage}
   */

  findOrCreate: function(user, callback) {
    return Storage.findOrCreate({
      'user': user.id
    }, {
      user: user,
      username: randomstring.generate({
        length: 30,
        charset: 'alphabetic',
        capitalization: 'lowercase',
      }),
      password: randomstring.generate(60),
      // TODO (aleblanc) hostname hard doded because configurator is not yet implemented
      hostname: "localhost"
      }
    )
      .then((storage) => {
        return callback(null, storage);
      })
      .catch((err) => {
        return callback(err);
      });
  }
};
