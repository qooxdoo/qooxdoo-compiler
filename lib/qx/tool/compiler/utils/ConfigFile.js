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

const fs = qx.tool.compiler.utils.Promisify.fs;
const process = require("process");
const path = require("path");
const get_value = require("get-value");
const set_value = require("set-value");

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
        await instance.load();
        instances[type] = instance;
      }
      return instances[type];
    }
  },

  properties: {
    /**
     * The config data
     */
    data: {
      check: "Object",
      event: "changeData",
      apply: "_applyData",
      nullable: false
    },

    /**
     * Flag to indicate that data has changed and needs to be saved
     */
    dirty: {
      check: "Boolean",
      init: false,
      event: "changeDirty"
    }
  },

  members: {
    /**
     * The path to the configuration file
     */
    __path: null,

    /**
     * The URL of the json-schema
     */
    __schemaUrl: null,

    /**
     * The internal schema signature object
     */
    __schema: null,


    /**
     * Applies the data, validating it against the schema that the model has been initialized with.
     * @param data The config data
     * @param old The old data
     * @private
     */
    _applyData(data, old) {
      if (old) {
        this.setDirty(true);
      }
      let schema = qx.tool.compiler.utils.Json.identifySchema(data);
      if (schema) {
        if (schema.url !== this.__schemaUrl) {
          throw new qx.tool.compiler.utils.UserError(`Invalid schema: expected ${this.__schemaUrl}, got ${schema.url}`);
        }
        qx.tool.compiler.utils.Json.validate(data, schema);
        this.__schema = schema;
      }
    },

    /**
     * Returns the URL of the JSON schema
     * @return {String}
     */
    getSchemaUrl() {
      return this.__schemaUrl;
    },

    /**
     * Loads the config data into the model. If no argument is given, load from
     * the file given when the instance was created. If an json object is passed,
     * use that data. In both cases, the data is validated against the schema
     * that the model has been initialized with.
     * Returns the instance for chaining
     * @param {Object} data
     * @return {qx.tool.compiler.utils.ConfigFile} Returns the instance for chaining
     */
    async load(data=undefined) {
      if (!await fs.existsAsync(this.__path)) {
        throw new Error(`Cannot load config file: ${this.__path} does not exist. Are you in the library root?`);
      }
      if (data === undefined) {
        data = qx.tool.compiler.utils.Json.parseJson(await fs.readFileAsync(this.__path, "utf8"));
      }
      this.setData(data);
      return this;
    },

    /**
     * Returns a value from the configuration map
     * @param prop_path {String|Array} The property path. See https://github.com/jonschlinkert/get-value#usage
     * @param options {*?} See https://github.com/jonschlinkert/get-value#options
     * @return {*}
     */
    getValue(prop_path, options) {
      return get_value(this.getData(), prop_path, options);
    },

    /**
     * Sets a value from the configuration map and validates the result against
     * the json schema of the model
     * @param prop_path {String|Array} The property path. See https://github.com/jonschlinkert/set-value#usage
     * @param value {*}
     * @param options {*?}
     * @return {qx.tool.compiler.utils.ConfigFile} Returns the instance for chaining
     */
    setValue(prop_path, value, options) {
      let data = this.getData();
      set_value(data, prop_path, value, options);
      this.setData(data); // this will validate it and throw if not valid
      return this;
    },

    /**
     * Save the data to the config file
     * @return {Promise<void>}
     */
    async save() {
      if (!this.isDirty()) {
        // no need to save anything
        return;
      }
      await qx.tool.compiler.utils.Json.saveJsonAsync(this.__path, this.getData());
    }
  }
});
