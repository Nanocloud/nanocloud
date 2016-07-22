import Ember from 'ember';

export function formatSize([value]/*, hash*/) {

  if (value < 1024) {
    return Number(value).toFixed(2) + ' bytes';
  }
  if (value < (1024 * 1024)) {
    return Number(value/1024).toFixed(2) + ' Ko';
  }
  if (value < (1024 * 1024 * 1024)) {
    return Number(value/1024/1024).toFixed(2) + ' Mo';
  }
  return Number(value/1024/1024/1024).toFixed(2) + ' Go';
}

export default Ember.Helper.helper(formatSize);
