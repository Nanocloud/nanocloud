export default function formatDuration(value) {
  
  if (value < 60) {
    return Number(value) + ' s';
  }
  if (value < (60 * 60)) {
    return Number(value/60).toFixed(2) + ' min';
  }
  if (value < (60 * 60 * 60)) {
    return Number(value/60/60).toFixed(2) + ' h';
  }
  return Number(value/60/60/60).toFixed(2) + ' d';
}
