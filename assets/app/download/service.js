import Ember from 'ember';

export default Ember.Service.extend({

  downloadFile(accessToken, filename) {

    Ember.$.ajax({
      type: "GET",
      headers: { Authorization : "Bearer " + accessToken},
      url: "/api/files/token",
      data: { filename: "./" + filename}
    })
    .then((response) => {
      let url = "/api/files?filename=" + encodeURIComponent("./" + filename) + "&token=" + encodeURIComponent(response.token); 
      window.location.assign(url);
    });
  }
});
