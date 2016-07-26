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

const supertestRequest = require('supertest');
const Validator = require('jsonapi-validator').Validator;
const validator = new Validator();
const Ajv = require('ajv');
const ajv = new Ajv();
const clone = require('clone');

module.exports = {

  request: function(app) {

    return supertestRequest(app);
  },

  isJsonApi: function(res) {

    validator.validate(res.body);
  },

  schema: function(schema) {

    return function(res) {
      var validate = ajv.compile(schema);
      var valid = validate(res.body);

      if (!valid) {
        throw new Error(ajv.errorsText(validate.errors));
      }
    };
  },

  jsonApiSchema: function(schema) {

    var JSONAPIschema = require('./JSONAPIschema.json');
    var clonedJSONAPIschema = clone(JSONAPIschema);

    clonedJSONAPIschema.definitions.attributes_data = schema;

    return this.schema(clonedJSONAPIschema);
  }
};
