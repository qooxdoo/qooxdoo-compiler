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
 *
 * *********************************************************************** */

require("@qooxdoo/framework");
const Ajv = require("ajv");
const betterAjvErrors = require("better-ajv-errors");
const fs = qx.tool.compiler.utils.Promisify.fs;
const JsonToAst = require("json-to-ast");

qx.Class.define("qx.tool.compiler.utils.Json", {

  statics: {
    /**
     * Parses JSON string into an object
     *
     * @param str {String} the data to parse
     * @return {Object}
     */
    parseJson: function(str) {
      if (str === null) {
        return null;
      }
      str = str.trim();
      if (!str) {
        return null;
      }
      // eslint-disable-next-line no-path-concat
      var qxRoot = __dirname + "/../../../../../";
      var ast = JsonToAst.parseToAst(str);
      var json = JsonToAst.astToObject(ast);
      var id = this.identifyData(json);
      if (id) {
        var ajv = new Ajv({
          allErrors: true,
          jsonPointers: true
        });
        var schema = "https://raw.githubusercontent.com/qooxdoo/qooxdoo-compiler/master/resource/" + id.type + "-" + String(id.version) + ".json";
        var valid = ajv
          .addSchema(require(qxRoot + "resource/compile-" + String(id.version) + ".json"))
          .addSchema(require(qxRoot + "resource/Manifest-" + String(id.version) + ".json"))
          .validate(schema, json);
        if (!valid) {
          const message = betterAjvErrors(schema, json, ajv.errors, {format: "cli", indent: 2});
          console.warn("WARNING: "+id.type + ".json\n" + message);
          if (id.version > 0) {
            const err = betterAjvErrors(schema, json, ajv.errors, {format: "js"});
            throw new Error(err[0].error);
          } else {
            console.warn("WARNING: "+id.type + ".json#" + err[0].error);
          }
        }
      }
      return json;
    },
    /**
     * Identify Type and Schema Version
     *
     * @param data {Object} Manifest.json or compile.json
     * @return {Object?} object with data and version key
     */

    identifyData: function(data) {
      if (data.$schema) {
        let match = data.$schema.match(/([^-/\s]+)-(\d+)\.json$/);
        if (match) {
          return {
            type: match[1],
            version: parseInt(match[2])
          };
        }
      }
      if (data.applications) {
        return {
          type: "compile",
          version: 0
        };
      }
      if (data.provides) {
        return {
          type: "Manifest",
          version: 0
        };
      }
      return null;
    },

    /**
     * Loads JSON data from a file and returns it as an object; if the file does not exist, then
     * null is returned
     *
     * @param filename {String} the filename to load
     * @return {Object?} the parsed contents, or null if the file does not exist
     */
    loadJsonAsync: async function(filename) {
      if (!await fs.existsAsync(filename)) {
        return null;
      }
      var data = await fs.readFileAsync(filename, "utf8");
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
     * @param data {Object?} the data to write
     */
    saveJsonAsync: async function(filename, data) {
      if (data) {
        await fs.writeFileAsync(filename, JSON.stringify(data, null, 2), "utf8");
      } else if (await fs.existsAsync(filename)) {
        fs.unlinkAsync(filename);
      }
    }

  }
});
