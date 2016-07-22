export default function getKeyFromValue(map, value) {
  for(var key in map) {
    if(map[key] === value) {
      return key;
    }
  }
  return -1;
}
