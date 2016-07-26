const crypto = require("crypto")

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
      username: crypto.randomBytes(32).toString('hex'),
      password: crypto.randomBytes(60).toString('hex'),
// TODO (aleblanc) hostname hard doded because configurator is not yet implemented
      hostname: "localhost"
      }
    )
      .then((storage) => {
        console.log(storage);
        console.log("then")
        return callback(null, storage);
      })
      .catch((err) => {
        console.log("catch")
        return callback(err);
      })
    /*  return Storage.findOne({
      'user': user.id
    })
      .then((storage) => {
        console.log("2 " + storage);
        if (storage === undefined) {
          console.log("if");
          Storage.create({
            password: Math.random().toString(60)
          })
            .then((storage) => {
              return callback(null, storage);
            })
            .catch((err) => {
            });
            console.log("Lool " + storage);
        } else {
          console.log("else");
        }
        return callback(null, storage);
      })
      .catch((err) => {
        return callback(err);
      })
*/
  }
};
