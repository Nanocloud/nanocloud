// jshint mocha:true

var nano = require('./lib/nanotest');
var expect = require('chai').expect;

module.exports = function() {

  describe("Histories", function() {

    afterEach('Cleaning database', function () {
	  Histories.query('TRUNCATE TABLE public.history', done);
	});

    const expectedSchema = {
      type: 'object',
      properties: {
        'user-mail': {type: 'string'},
        'user-id': {type: 'string'},
        'user-firstname': {type: 'string'},
        'user-lastname': {type: 'string'},
		'connection-id': {type: 'string'},
		'start-date': {type: 'string'},
		'end-date': {type: 'string'},
		'machine-id': {type: 'string'},
		'machine-size': {type: 'string'},
		'machine-driver': {type: 'string'},
		'duration': {type: 'string'},
        'created-at': {type: 'string'},
        'updated-at': {type: 'string'}
      },
      required: ['user-mail','user-id','user-firstname','user-lastname','connection-id','start-date','end-date','machine-id','machine-size','machine-driver','created-at','updated-at'],
      additionalProperties: false
    };

	describe("Create history", () => {
      it('Should create history', (done) => {
        nano.request(sails.hooks.http.app)
          .post('/api/histories')
          .send({
            data: {
              attributes: {
                'user-mail': 'admin@nanocloud.com',
                'user-id': 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
                'user-firstname': 'Admin',
                'user-lastname': 'Nanocloud',
		        'connection-id': 'Desktop',
		        'start-date': 'Wed Jul 21 14:10:00 UTC 2016',
		        'end-date': '',
	        	'machine-id': 'f7362994-a8df-4ed6-89f5-99092b145999',
		        'machine-size': '',
		        'machine-driver': 'dummy',
		        'duration': null
              },
              type: 'histories'
            }
          })
          .set('Authorization', 'Bearer admintoken')
          .expect(201)
          .expect(nano.jsonApiSchema(expectedSchema))
		  .then((res) => {
			return nano.request(sails.hooks.http.app)
			  .get('/api/hitories')
			  .expect(200)
			  .expect(nano.jsonApiSchema(expectedSchema))
			  .expect((res) => {
			    expect(res.body.data[0].attributes.startDate).to.equal('Wed Jul 21 14:10:00 UTC 2016');
			  });
		  })
		  .then((res) => {
			return nano.request(sailt.hooks.http.app)
			  .post('/api/histories/' + res.body.data[0].id)
			  .send({
                data: {
                  attributes: {
                    'user-mail': 'admin@nanocloud.com',
                    'user-id': 'aff17b8b-bf91-40bf-ace6-6dfc985680bb',
                    'user-firstname': 'Admin',
                    'user-lastname': 'Nanocloud',
		            'connection-id': 'Desktop',
		            'start-date': 'Wed Jul 21 14:10:00 UTC 2016',
		            'end-date': 'Wed Jul 21 14:20:00 UTC 2016',
	            	'machine-id': 'f7362994-a8df-4ed6-89f5-99092b145999',
		            'machine-size': '',
		            'machine-driver': 'dummy',
		            'duration': null
                  },
                  type: 'histories'
                }
			  })
              .set('Authorization', 'Bearer admintoken')
              .expect(200)
              .expect(nano.jsonApiSchema(expectedSchema))
			  .expect((res) => {
			    expect(res.body.data[0].attributes.endDate).to.equal('Wed Jul 21 14:20:00 UTC 2016');
			  });
		  })
          .end(done);
	  });

      it('Should return created history', (done) => {
        nano.request(sails.hooks.http.app)
          .get('/api/histories')
          .set('Authorization', 'Bearer admintoken')
          .expect(200)
          .expect(nano.jsonApiSchema(expectedSchema))
		  .expect((res) => {
			 expect(res.body.data[0].attributes.endDate).to.equal('Wed Jul 21 14:20:00 UTC 2016');
		  })
          .end(done);
	  });

	});
  });
};
