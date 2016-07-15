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
