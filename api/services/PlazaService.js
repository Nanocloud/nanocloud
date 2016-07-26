const http = require("http")

module.exports = {

  exec: function(hostname, cmd, stdin) {
    let data = {
      "command": cmd,
      "stdin": stdin
    };

    let options = {
      host: hostname,
      path: '/exec',
      port: '9090',
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    }

    let req = http.request(options, function (response) {
      response.on('data', function (data) {
        console.log(JSON.parse(data));
      });
    });

    req.write(JSON.stringify(data));
    req.end();
  },

  files: function(hostname, filename, path, next) {
    let options = {
      host: hostname,
      path: "/files?path=" + path,
      port: '9090',
      method: 'GET'
    }

    let req = http.request(options, function(response) {
      response.on('data', function (data) {
        next(JSON.parse(data));
      });
    });

    req.end();
  },

  upload: function(hostname, filename, path) {
    let options = {
      host: hostname,
      path: "/upload?filename" + filename,
      port: 9090,
      method: 'POST'
    }

    let req = http.request(options, function(response) {
      console.log(response.body);
    });
  }
};
