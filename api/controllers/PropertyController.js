/**
 * PropertyController is responsible of the installation properties. Those are
 * publicly accessible (without authentication) and are firstly used to customize
 * the frontend.
 *
 * @class PropertyController
 */

/* globals ConfigService */

module.exports = {

  /**
   * find retreives all the properties
   *
   * @method find
   * @public true
   */
  find(req, res) {

    ConfigService.get(
      'title', 'favIconPath', 'logoPath', 'primaryColor'
    )
    .then((config) => {

      let logo = '';
      if (config.logoPath) {
        logo = [
          `.sidebar-logo{background-image:url(${config.logoPath})}`,
          `.login-logo{background-image:url(${config.logoPath})}`
        ].join('');
      }

      let favIcon = 'favicon.ico';
      if (config.favIconPath) {
        favIcon = config.favIconPath;
      }

      let sidebarColor = `.sidebar{background-color:${config.primaryColor}}`;

      res.send({
        primaryColor: config.primaryColor,
        title: config.title,
        style: logo + sidebarColor,
        favicon: favIcon
      });
    })
    .catch((err) => res.negotiate(err));
  }

};
