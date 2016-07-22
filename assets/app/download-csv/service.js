import Ember from 'ember';
import formatTimeDuration from 'nanocloud/utils/format-duration';

export default Ember.Service.extend({

  downloadCSV(accessToken, model) {

    var csvContent = "data:text/csv;charset=utf-8,";

    csvContent += "USERNAME,USERID,CONNECTION,START,END,DURATION\n"; 

    model.forEach(function(item) {
      csvContent += 
        item.get('userFullName') + "," +
        item.get('userId') + "," +
        item.get('connectionId') + "," +
        item.get('startDate') + "," +
        item.get('endDate') + ',' +
        formatTimeDuration(item.get('duration') / 1000) + '\n';
    });

    let url = encodeURI(csvContent);
    window.location.assign(url);
  }
});
