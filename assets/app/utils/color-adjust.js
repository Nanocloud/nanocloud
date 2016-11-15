/**
 * Nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud.
 *
 * Nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

export default function colorAdjust(col, amt) {

  function limitCheck(color) {
    if (color > 255) {
      color = 255;
    } else if  (color < 0) {
      color = 0;
    }
    return color;
  }

  function singleColorToHexString(color) {
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

  green = limitCheck(green);
  blue = limitCheck(blue);
  red = limitCheck(red);

  green = singleColorToHexString(green);
  blue = singleColorToHexString(blue);
  red = singleColorToHexString(red);

  return (usePound ? '#' : '') + red + blue + green;
}
