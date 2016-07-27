const supertestRequest = require('supertest');
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
      "title": "JSON API Schema",
      "description": "This is a schema for responses in the JSON API format. For more, see http://jsonapi.org",
      "type": "object",
      "required": [
        "data"
      ],
      "properties": {
        "data": {
          "$ref": "#/definitions/data"
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
            }
          },
          "additionalProperties": false
        },
        "attributes": schema
      }
    };

    return this.schema(JSONAPIschema);
  }
};
