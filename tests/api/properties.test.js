// jshint mocha:true

var nano = require('./lib/nanotest');

module.exports = function() {

  describe('Properties', () => {

    describe('Retrieve properties', () => {

      it('Should return the default properties', (done) => {

        nano.request(sails.hooks.http.app)
        .get('/api/properties')
        .expect(200, {
          title: 'Nanocloud',
          primaryColor: '#006CB6',
          style: [
            '.sidebar-logo{background-image:url(/assets/images/logo.png)}',
            '.login-logo{background-image:url(/assets/images/logo.png)}',
            '.sidebar{background-color:#006CB6}'
          ].join(''),
          favicon: 'favicon.ico'
        }, done);
      });
    });
  });
};
