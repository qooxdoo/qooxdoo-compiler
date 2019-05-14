/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2019 The qooxdoo developers

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Boulanger (info@bibliograph.org, @cboulanger)

************************************************************************ */

const safe_require = require("../../compiler/utils/safe-require");
const fs = qx.tool.compiler.utils.Promisify.fs;
const process = require("process");
const path = require("path");
const get_value = safe_require("get-value");
const set_value = safe_require("set-value");

/**
 * A model for config files
 */
qx.Class.define("qx.tool.compiler.utils.ConfigFile", {
  construct: function(filePath, schemaUrl) {
    this.__path = filePath;
    this.__schemaUrl = schemaUrl;
  },

  statics: {

    $$instances: null,

    async getInstanceByType(type) {
      if (!qx.tool.ConfigFile.$$instances) {
        qx.tool.ConfigFile.$$instances = [];
      }
      let instances = qx.tool.ConfigFile.$$instances;
      if (instances[type] === undefined) {
        if (qx.tool.ConfigSchemas[type] === undefined) {
          throw new Error(`Config file type '${type} is not defined.`);
        }
        let filePath = path.join(process.cwd(), qx.tool.ConfigSchemas[type].filename);
        let schemaUrl = qx.tool.ConfigSchemas[type].schemaUrl;
        let instance = new qx.tool.compiler.utils.ConfigFile(filePath, schemaUrl);
        await instance.read();
        instances[type] = instance;
      }
      return instances[type];
    }
  },

  members: {
    __path: null,
    __schemaUrl: null,
    __data: null,

    getSchemaUrl() {
      return this.__schemaUrl;
    },

    async load(data=false) {
      if (!await fs.existsAsync(this.__path)) {
        throw new Error(`Cannot load config file: ${this.__path} does not exist. Are you in the library root?`);
      }
      let data = await qx.tool.compiler.utils.Json.loadJsonAsync(this.__path);
      try {
        this.__data = qx.tool.compiler.utils.Json.parseJson(data);
      } catch (e) {
        throw new Error(`Failed to load ${this.__path}: ${e}`);
      }
    }
  }
});
