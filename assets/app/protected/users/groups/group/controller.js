import Ember from 'ember';

export default Ember.Controller.extend({

  currentTab: 0,
  tab: [
    { title: "General", link: "protected.users.groups.group.index" },
    { title: "Members", link: "protected.users.groups.group.members" },
    { title: "Applications", link: "protected.users.groups.group.apps" },
  ],
  selectedTab: Ember.computed('currentTab', 'currentTab', function() {
    return this.get('tab')[this.get('currentTab')].title;
  }),
  actions: {
    setCurrentTab(tab) {
      this.set('currentTab', tab);
    }
  }
});
