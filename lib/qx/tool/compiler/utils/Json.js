/* ************************************************************************
 *
 *    qooxdoo-compiler - node.js based replacement for the Qooxdoo python
 *    toolchain
 *
 *    https://github.com/qooxdoo/qooxdoo-compiler
 *
 *    Copyright:
 *      2011-2018 Zenesis Limited, http://www.zenesis.com
 *
 *    License:
 *      MIT: https://opensource.org/licenses/MIT
 *
 *      This software is provided under the same licensing terms as Qooxdoo,
 *      please see the LICENSE file in the Qooxdoo project's top-level directory
 *      for details.
 *
 *    Authors:
 *      * John Spackman (john.spackman@zenesis.com, @johnspackman)
 *      * oetiker
 *      * cboulanger
 *
 * *********************************************************************** */

require("@qooxdoo/framework");
const Ajv = require("ajv");
const betterAjvErrors = require("better-ajv-errors");
const fs = qx.tool.compiler.utils.Promisify.fs;
const JsonToAst = require("json-to-ast");
const path = require("path");
qx.Class.define("qx.tool.compiler.utils.Json", {

  statics: {
    /**
     * Parses JSON string into an object and validates the object if a json schema
     * has been specified.
     * @param str {String} the data to parse
     * @return {Object}
     */
    parseJson: function(str) {
      if (str === null || !str.trim()) {
        return null;
      }
      let ast = JsonToAst.parseToAst(str.trim());
      let json = JsonToAst.astToObject(ast);
      let schema = this.identifySchema(json);
      if (schema) {
        qx.tool.compiler.utils.Json.validate(json, schema);
      }
      return json;
    },

    /**
     * Returns the schema-specific part of an URI (either local or in the web)
     * @param schema
     * @return {{file:String, url:String}}
     */
    getSchemaInfo(schema) {
      let common = path.join("v" + schema.version, qx.tool.ConfigSchemas[schema.type].filename);
      return {
        file: path.join(qx.tool.ConfigSchemas.schemaBaseDir, common),
        url:  path.join(qx.tool.ConfigSchemas.schemaBaseUrl, common)
      };
    },

    /**
     * Validates a json object against the given schema signature and outputs
     * diagnostic information if validation failed
     * @param json {Object}
     * @param schema {Object}
     */
    validate(json, schema) {
      let ajv = new Ajv({
        allErrors: true,
        jsonPointers: true
      });
      let schemaInfo = qx.tool.compiler.utils.Json.getSchemaInfo(schema);
      let valid = ajv.addSchema(schemaInfo.file).validate(schemaInfo.url, json);
      if (!valid) {
        if (schema.version > 0) {
          const err = betterAjvErrors(schemaInfo.url, json, ajv.errors, {format: "js"});
          throw new Error(err[0].error);
        }
        const message = betterAjvErrors(schemaInfo.url, json, ajv.errors, {format: "cli", indent: 2});
        console.warn("WARNING: "+schema.type + ".json\n" + message);
      }
    },

    /**
     * Identify type and version of Schema
     * @param data {Object} Manifest.json or compile.json
     * @return {Object|null} Object with data and version key or null if not
     * schema could be detected
     */
    identifySchema: function(data) {
      if (data.$schema) {
        let match = data.$schema.match(/([^-/\s]+)-([^.]+)\.json$/);
        if (match) {
          return {
            type: match[1],
            version: match[2]
          };
        }
      }
      if (data.targets) {
        return {
          type: "compile",
          version: "0"
        };
      }
      if (data.info && data.provides) {
        return {
          type: "manifest",
          version: "0"
        };
      }
      return null;
    },

    /**
     * Loads JSON data from a file and returns it as an object; if the file does not exist, then
     * null is returned
     *
     * @param filename {String} the filename to load
     * @return {Object|null} the parsed contents, or null if the file does not exist
     */
    loadJsonAsync: async function(filename) {
      if (!await fs.existsAsync(filename)) {
        return null;
      }
      let data = await fs.readFileAsync(filename, "utf8");
      try {
        return qx.tool.compiler.utils.Json.parseJson(data);
      } catch (ex) {
        throw new Error("Failed to load " + filename + ": " + ex);
      }
    },

    /**
     * Saves JSON data to a file, or erases the file if data is null
     *
     * @param filename {String} filename to write to
     * @param data {Object|null} the data to write. If null, remove the file
     */
    saveJsonAsync: async function(filename, data) {
      if (data !== null) {
        await fs.writeFileAsync(filename, JSON.stringify(data, null, 2), "utf8");
      } else if (await fs.existsAsync(filename)) {
        fs.unlinkAsync(filename);
      }
    }
  }
});
