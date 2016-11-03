export default function colorAdjust(col, amt) {

  function LimitCheck(color) {
    if (color > 255) {
      color = 255;
    } else if  (color < 0) {
      color = 0;
    }
    return color;
  }

  function SingleColorToHexString(color) {
    color = color.toString(16); // Convert to a string in base 16
    return (color.length === 1) ? '0' + color : color;
  }

  var usePound = false;

  if (col[0] === '#') {
    col = col.slice(1);
    usePound = true;
  }

  var num = parseInt(col,16);
  var red = (num >> 16) + amt;
  var blue = ((num >> 8) & 0x00FF) + amt;
  var green = (num & 0x0000FF) + amt;

  green = LimitCheck(green);
  blue = LimitCheck(blue);
  red = LimitCheck(red);

  green = SingleColorToHexString(green);
  blue = SingleColorToHexString(blue);
  red = SingleColorToHexString(red);

  return (usePound ? '#' : '') + red + blue + green;
}
