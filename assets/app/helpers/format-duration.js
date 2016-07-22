import Ember from 'ember';

export function formatDuration([value]/*, hash*/) {
  return window.humanizeDuration(value * 1000, { round: true });
}

export default Ember.Helper.helper(formatDuration);
