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

import getKeyFromValue from 'nanocloud/utils/get-key-from-value';
import { module, test } from 'qunit';

module('Unit | Utility | get key from value');

var map = {
  object1: 'value1',
  object2: 'value2',
  object3: 'value3',
  object4: 'value4',
};


// Replace this with your real tests.
test('it should return the key for a value that exists', function(assert) {

  let result = getKeyFromValue(map, 'value2');
  assert.equal(result, 'object2');
});

test('it should return -1 if value was not found', function(assert) {

  let result = getKeyFromValue(map, 'value0');
  assert.equal(result, -1);
});
