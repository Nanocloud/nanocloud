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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* globals sails, Config */

const Promise = require('bluebird');
const _ = require('lodash');

/**
 * Return the type of val. It is similar to typeof except that it returns
 * 'array' for arrays
 *
 * @method typeOf
 * @private
 * @param {Object} val The variable from which the type will be returned
 * @return {String}
 */
function typeOf(val) {
  const type = (typeof val);
  if (type === 'object' && Array.isArray(val)) {
    return 'array';
  }
  return type;
}

/**
 * Return the type for config variable name
 *
 * @method getVariableType
 * @private
 * @return {String}
 */
function getVariableType(name) {
  return typeOf(sails.config.nanocloud[name]);
}

/**
 * Deserialize value according to the type of the default value of 'name'
 *
 * @method deserialize
 * @public
 * @param {String} name The name of the config variable
 * @param {Object} value The value to be deserialized
 * @return {Object} The deserilazied value.
 */
function deserialize(name, value) {
  switch (getVariableType(name)) {
  case 'number':
    value = parseInt(value, 10);
    if (Number.isNaN(value)) {
      throw new Error(`Config variable '${name}' must be an number.`);
    }
    break;

  case 'array':
    value = JSON.parse(value);
    if (!Array.isArray(value)) {
      throw new Error(`Config variable '${name}' must be an array.`);
    }
    break;

  case 'object':
    try {
      value = JSON.parse(value);

      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Config variable '${name}' must be an object.`);
      }
    } catch (e) {
      throw new Error(`Config variable '${name}' must be an object.`);
    }
    break;

  case 'boolean':
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else {
      throw new Error(`Config variable '${name}' must be an boolean.`);
    }
    break;

  case 'string':
    break;

  default:
    throw new Error(`Config variable '${name}' as an invalid value.`);
  }
  return value;
}

/**
 * nanocloudConfigValue returns the value associated to the config variable's
 * name. It will retrieve the value from the environment variable if any and
 * ensure that the type of the varriable is the same as the defaultValue.
 * If default value is an object, the environment variable is expected to be a
 * serialized JSON object.
 * If it's an array, it's expected to be a serialized JSON array.
 * Otherwise, it returns the defaultValue.
 *
 * @method nanocloudConfigValue
 * @private
 * @param {String} name Name of the config variable
 * @param {String} defaultValue The value to return if the environment variable
 * "name" is not set.
 * @return {Object} The environment variable if found (casted to the type of
 * defaultValue). defaultValue otherwise.
 */
function nanocloudConfigValue(name, defaultValue) {
  let value;

  // Sails configuration variables are in camelCase whereas environment variables are expected to be in snake_case
  name = _.toUpper(_.snakeCase(name));

  if (process.env.hasOwnProperty(name)) {
    let type;

    let envValue  = process.env[name];

    if (Array.isArray(defaultValue)) {
      type = 'array';
    } else {
      type = (typeof defaultValue);
    }

    switch (type) {
    case 'number':
      value = parseInt(envValue, 10);
      if (Number.isNaN(value)) {
        throw new Error(`Config variable '${name}' must be a number.`);
      }
      break;

    case 'array':
      value = JSON.parse(envValue);
      if (!Array.isArray(value)) {
        throw new Error(`Config variable '${name}' must be an array.`);
      }
      break;

    case 'object':
      value = JSON.parse(envValue);
      if (typeof value !== 'object') {
        throw new Error(`Config variable '${name}' must be an object.`);
      }
      break;

    case 'boolean':
      if (envValue === 'true') {
        value = true;
      } else if (envValue === 'false') {
        value = false;
      } else {
        throw new Error(`Config variable '${name}' must be a boolean.`);
      }
      break;

    case 'string':
      value = envValue;
      break;

    }
  } else {
    return defaultValue;
  }

  return value;
}

/**
 * get retreives the values of the specified config variables.
 *
 * @method get
 * @public
 * @param {[]String} keys The names of the variable to retreive
 * @return {Promise[Object]} A promise that resolves a hash of the retreived
 * variables
 */
function get(...keys) {
  return new Promise((resolve, reject) => {
    Config.find({
      key: keys
    }, (err, res) => {
      if (err) {
        reject(err);
      } else {
        let rt = {};
        res.forEach((row) => {
          rt[row.key] = deserialize(row.key, row.value);
        });
        resolve(rt);
      }
    });
  });
}

/**
 * set saves the specified configuration variable in the database.
 * If the variable exists already, the value is updated.
 *
 * @method set
 * @public
 * @param {String} key The name of the variable to create
 * @param {String} value The value of the variable to create
 * @return {Promise[null]}
 */
function set(key, value) {
  let type = typeOf(value);
  let expectedType = getVariableType(key);

  if (type !== expectedType) {
    return Promise.reject(new Error(`Invalid data type for ${key}. Expected ${expectedType}. Got ${type}.`));
  }

  switch (type) {
  case 'number':
    value = value.toString();
    break;

  case 'array':
  case 'object':
    value = JSON.stringify(value);
    break;

  case 'boolean':
  case 'string':
      // value = value;
    break;

  default:
    return Promise.reject(new Error(`Invalid data type ${type}`));
  }

  return new Promise((resolve, reject) => {
    Config.query({
      text: `INSERT INTO
      config ("key", "value", "createdAt", "updatedAt")
      VALUES($1::varchar, $2::varchar, NOW(), NOW())
      ON CONFLICT(key) DO UPDATE SET value = excluded.value,
      "updatedAt" = NOW()`,
      values: [key, value]
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * init initializes the ConfigService. It will copy the configuration variables
 * found in `config.nanocloud` in the database.
 *
 * @method init
 * @private
 * @param {Function} callback Completion callback
 * @return {Promise[null]}
 */
function init(callback) {
  const config = sails.config.nanocloud;
  let actions = [];

  for (let name in config) {
    if (config.hasOwnProperty(name)) {
      actions.push(set(name, nanocloudConfigValue(name, config[name])));
    }
  }

  return Promise.all(actions).then(callback, callback);
}

/**
 * unset deletes the config variable named in the `keys` parameter.
 *
 * @method unset
 * @public
 * @param {[]String} keys The names of the keys to delete
 * @return {Promise[null]}
 */
function unset(...keys) {
  return new Promise((resolve, reject) => {
    Config.destroy(keys, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = { get, set, unset, init, deserialize };
