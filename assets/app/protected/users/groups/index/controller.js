import Ember from 'ember';

export default Ember.Controller.extend({

  groupController: Ember.inject.controller('protected.users.groups.group'),
  groupBinding: 'groupController.model',
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

  setData: function() {
    if (!this.get('items')) {
      return;
    }
    var ret = Ember.A([]);
    this.get('items').forEach((item) => {
      ret.push(Ember.Object.create({
        id: item.get('id'),
        name: item.get('name'),
        members: item.get('members.length'),
        apps: item.get('apps.length'),
      }));
    });
    this.set('data', ret);
    return ret;
  },

  columns: [
    {
      "propertyName": "name",
      "title": "Group name",
      "disableFiltering": true,
      "filterWithSelect": false,
      "template": "sortable-table/group/group-edit"
    },
    {
      "propertyName": "members",
      "title": "number of member",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
    {
      "propertyName": "apps",
      "title": "number of application",
      "disableFiltering": true,
      "filterWithSelect": false,
    },
  ],
});
