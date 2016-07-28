const http = require("http");
const fs = require("fs");

module.exports = {

  exec: function(hostname, cmd, stdin, callback) {
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
    };

    let req = http.request(options, function (response) {
      response.on('data', function (data) {
        callback(JSON.parse(data));
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
    };

    let req = http.request(options, function(response) {
      response.on('data', function (data) {
        next(JSON.parse(data));
      });
    });
    req.end();
  },

  download: function(hostname, path, callback) {
    let options = {
      host: hostname,
      path: "/files?path=" + encodeURI(path),
      port: '9090',
      method: 'GET'
    };

    let req = http.request(options, function(response) {
      callback(response);
    });
    req.end();
  },

  upload: function(storage, file, callback) {
    let options = {
      host: storage.hostname,
      path: "/upload?filename=" + encodeURI(file.filename) + "&username=" + storage.username,
      port: 9090,
      method: 'POST'
    };

    let readableStream = fs.createReadStream(file.fd);
    readableStream.pipe(http.request(options, callback));
  }
};
