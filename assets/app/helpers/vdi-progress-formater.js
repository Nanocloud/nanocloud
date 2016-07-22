import Ember from 'ember';

export function vdiProgressFormater([value, noStatus]) {
  let val = Math.floor(value * 100);
  if (!noStatus && val >= 90 && val <= 100) {
    val = 'Reassembling';
  }
  if (Number.isInteger(val)) {
    return val + "%";
  }
  else {
    return val;
  }
}

export default Ember.Helper.helper(vdiProgressFormater);
