import Ember from 'ember';
import config from 'nanocloud/config/environment';

export function initialize(app) {
  /* global $:false */
  app.deferReadiness();

  Ember.$.getJSON('/api/properties')
  .then((res) => {
    let head = Ember.$(document.head);

    document.title = res.title;
    config.APP.name = res.title;

    $('title').text(res.title);
    let favicon = Ember.$('<link rel="shortcut icon">');
    favicon.attr('href', res.favicon);
    head.append(favicon);

    let s = Ember.$('<style></style>');
    s.html(res.style);
    head.append(s);
    app.advanceReadiness();
  });
}

export default {
  name: 'properties',
  initialize
};
