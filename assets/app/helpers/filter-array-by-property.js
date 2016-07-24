import Ember from 'ember';

export function filterArrayByProperty([list, item, property]/*, hash*/) {

  if (list.filterBy(property, item.get(property)).length === 0) {
    return false;
  }
  else {
    return true;
  }
}

export default Ember.Helper.helper(filterArrayByProperty);
