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

const supertestRequest = require('supertest-as-promised');
const Validator = require('jsonapi-validator').Validator;
const validator = new Validator();
const Ajv = require('ajv');
const ajv = new Ajv();

module.exports = {

  request: function(app) {

    return supertestRequest(app);
  },

  isJsonApi: function(res) {

    validator.validate(res.body);
  },

  adminLogin: function() {

    return {
      Authorization: 'Bearer admintoken'
    };
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

    let JSONAPIschema = {
      title: 'JSON API Schema',
      description: 'This is a schema for responses in the JSON API format. For more, see http://jsonapi.org',
      type: 'object',
      required: [
        'data'
      ],
      properties: {
        data: {
          $ref: '#/definitions/data'
        }
      },
      definitions: {
        data: {
          description: 'The document\'s "primary data" is a representation of the resource or collection of resources targeted by a request.',
          oneOf: [
            {
              $ref: '#/definitions/resource'
            },
            {
              description: 'An array of resource objects, an array of resource identifier objects, or an empty array ([]), for requests that target resource collections.',
              type: 'array',
              items: {
                $ref: '#/definitions/resource'
              },
              uniqueItems: true
            }
          ]
        },
        resource: {
          description: '\'Resource objects\' appear in a JSON API document to represent resources.',
          type: 'object',
          required: [
            'type',
            'id'
          ],
          properties: {
            type: {
              type: 'string'
            },
            id: {
              type: 'string'
            },
            attributes: {
              $ref: '#/definitions/attributes'
            }
          },
          additionalProperties: false
        },
        attributes: schema
      }
    };

    return this.schema(JSONAPIschema);
  }
};
