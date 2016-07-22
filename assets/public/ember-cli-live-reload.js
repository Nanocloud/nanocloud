(function() {
  var src = (location.protocol || 'http:') + '//' + (location.hostname || 'localhost') + ':49153/livereload.js?snipver=1';
  var script    = document.createElement('script');
  script.type   = 'text/javascript';
  script.src    = src;
  document.getElementsByTagName('head')[0].appendChild(script);
}());
