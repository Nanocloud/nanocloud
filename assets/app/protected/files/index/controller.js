import Ember from 'ember';

export default Ember.Controller.extend({

  store: Ember.inject.service('store'),
  session: Ember.inject.service('session'),
  download: Ember.inject.service('download'),
  items: null,

  modelIsEmpty: Ember.computed.empty('items', 'items'),

  sortableTableConfig: {

    filteringIgnoreCase: true,
    messageConfig: {
      searchLabel: "Search",
    },

    customIcons: {
      "sort-asc": "fa fa-caret-up",
      "sort-desc": "fa fa-caret-down",
      "caret": "fa fa-minus",
      "column-visible": "fa fa-minus",
    },

    customClasses: {
      "pageSizeSelectWrapper": "pagination-number"
    }
  },

  data : Ember.computed('items', 'items', function() {

    var ret = Ember.A([]);
    this.get('items').forEach(function(item) {
      if (item.get('type') !== 'directory') {
        ret.push(Ember.Object.create({
          type: item.get('icon'),
          name: item.get('name'),
          size: item.get('size'),
        }));
      }
    });
    return ret;
  }),

  columns: function() {

    return [
        {
          "propertyName": "type",
          "title": "Type",
          "disableFiltering": true,
          "filterWithSelect": false,
          "className": "short",
          "template": "sortable-table/file-type",
          "disableSorting": true,
        },
        {
          "propertyName": "name",
          "title": "Filename",
          "disableFiltering": true,
          "filterWithSelect": false,
        },
        {
          "propertyName": "size",
          "title": "Size",
          "disableFiltering": true,
          "filterWithSelect": false,
          "template": "sortable-table/size",
        },
        {
          "title": "Action",
          "className": "short",
          "template": "sortable-table/download-button",
          "disableSorting": true,
        }
    ];
  }.property(),

  actions : {

    uploadCallback(callback) {
      callback();
    },

    downloadFile: function(filename) {
      this.get('download').downloadFile(this.get('session.access_token'), filename);
    },
  }
});
