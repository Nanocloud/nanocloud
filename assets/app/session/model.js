import Model from 'ember-data/model';
import DS from 'ember-data';

export default Model.extend({

    Id: DS.attr('string'),
    sessionName: DS.attr('string'),
    username: DS.attr('string'),
    state: DS.attr('string'),
		userId: DS.attr('string'),
});
