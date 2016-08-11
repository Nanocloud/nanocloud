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

const supertestRequest = require("supertest-as-promised");
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
      'Authorization': 'Bearer admintoken'
    };
  },

  adminId: function() {
    return "aff17b8b-bf91-40bf-ace6-6dfc985680bb";
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

  getJsonApiSchema: function() {

    const JSONAPIschema = {
      "title": "JSON API Schema",
      "description": "This is a schema for responses in the JSON API format. For more, see http://jsonapi.org",
      "type": "object",
      "required": [
        "data"
      ],
      "properties": {
        "data": {
          "$ref": "#/definitions/data"
        },
        "included": {
          "description": "To reduce the number of HTTP requests, servers **MAY** allow responses that include related resources along with the requested primary resources. Such responses are called \"compound documents\".",
          "type": "array",
          "items": {
            "$ref": "#/definitions/resource"
          },
          "uniqueItems": true
        }
      },
      "definitions": {
        "data": {
          "description": "The document's \"primary data\" is a representation of the resource or collection of resources targeted by a request.",
          "oneOf": [
            {
              "$ref": "#/definitions/resource"
            },
            {
              "description": "An array of resource objects, an array of resource identifier objects, or an empty array ([]), for requests that target resource collections.",
              "type": "array",
              "items": {
                "$ref": "#/definitions/resource"
              },
              "uniqueItems": true
            }
          ]
        },
        "resource": {
          "description": "\"Resource objects\" appear in a JSON API document to represent resources.",
          "type": "object",
          "required": [
            "type",
            "id"
          ],
          "properties": {
            "type": {
              "type": "string"
            },
            "id": {
              "type": "string"
            },
            "attributes": {
              "$ref": "#/definitions/attributes"
            },
            "relationships": {
              "$ref": "#/definitions/relationships"
            }
          },
          "additionalProperties": false
        },
        "attributes": {
          "description": "Members of the attributes object (\"attributes\") represent information about the resource object in which it's defined.",
          "type": "object",
          "patternProperties": {
            "^(?!relationships$|links$)\\w[-\\w_]*$": {
              "description": "Attributes may contain any valid JSON value."
            }
          },
          "additionalProperties": false
        },
        "relationships": {
          "description": "Members of the relationships object (\"relationships\") represent references from the resource object in which it's defined to other resource objects.",
          "type": "object",
          "patternProperties": {
            "^\\w[-\\w_]*$": {
              "properties": {
                "data": {
                  "description": "Member, whose value represents \"resource linkage\".",
                  "oneOf": [
                    {
                      "$ref": "#/definitions/relationshipToOne"
                    },
                    {
                      "$ref": "#/definitions/relationshipToMany"
                    }
                  ]
                },
                "meta": {
                  "$ref": "#/definitions/meta"
                }
              },
              "additionalProperties": false
            }
          },
          "additionalProperties": false
        },
        "relationshipToOne": {
          "description": "References to other resource objects in a to-one (\"relationship\"). Relationships can be specified by including a member in a resource's links object.",
          "anyOf": [
            {
              "$ref": "#/definitions/empty"
            },
            {
              "$ref": "#/definitions/linkage"
            }
          ]
        },
        "relationshipToMany": {
          "description": "An array of objects each containing \"type\" and \"id\" members for to-many relationships.",
          "type": "array",
          "items": {
            "$ref": "#/definitions/linkage"
          },
          "uniqueItems": true
        },
        "empty": {
          "description": "Describes an empty to-one relationship.",
          "type": ["object", "null"],
          "properties": {},
          "additionalProperties": false
        },
        "linkage": {
          "description": "The \"type\" and \"id\" to non-empty members.",
          "type": "object",
          "required": [
            "type",
            "id"
          ],
          "properties": {
            "type": {
              "type": "string"
            },
            "id": {
              "type": "string"
            },
            "meta": {
              "$ref": "#/definitions/meta"
            }
          },
          "additionalProperties": false
        },
        "meta": {
          "description": "Non-standard meta-information that can not be represented as an attribute or relationship.",
          "type": "object",
          "additionalProperties": true
        },

      }
    };

    return JSONAPIschema;
  },

  jsonApiRelationship: function(expectedRelationships) {

    return function(res) {
      for (let name in expectedRelationships) {
        let expectedRelationship = expectedRelationships[name];

        if (res.body.data.relationships === undefined) {
          throw new Error("Expected relationship " + name + " is not present in payload.");
        }
        let actualRelationship = res.body.data.relationships[name];

        if (actualRelationship === undefined) {
          throw new Error("No relation " + name + " in response.");
        }

        let match = false;
        for (let recordName in actualRelationship) {
          let record = actualRelationship[recordName];

          if (record === expectedRelationship) {
            match = true;
          }
        }

        if (match === false) {
          throw new Error("Relation ship " + recordName + " not found.");
        }
      }
    };

  },

  jsonApiSchema: function(schema) {

    let JSONAPIschema = this.getJsonApiSchema();

    JSONAPIschema.definitions.attributes = schema;
    return this.schema(JSONAPIschema);
  }
};
