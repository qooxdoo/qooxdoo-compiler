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
const semver = require("semver");
const get_value = require("get-value");
const set_value = require("set-value");

/**
 * A model for config files
 */
qx.Class.define("qx.tool.compiler.utils.ConfigFile", {
  extend: qx.core.Object,

  /**
   * Constructor
   * @param {String} filePath
   * @param {String} schemaUri
   *    URI that uniquely identifies the schema.
   *    Should be an URL from which the schema JSON can be downloaded.
   * @param {String|undefined} schemaVersion Optional information on the
   * version of the schema
   */
  construct: function(filePath, schemaUri, schemaVersion) {
    if (!filePath || !schemaUri) {
      throw new TypeError("Missing schema path and/or uri.");
    }
    this.__path = filePath;
    this.__schemaUri = schemaUri;
    this.__schemaVersion = schemaVersion;
  },

  statics: {

    $$instances: null,

    /**
     * Factory function to create singletons of a config file model
     * @param {String} type
     * @param {Boolean} doNotLoad If true, don't load the model yet. Default: false
     * @return {Promise<qx.tool.compiler.utils.ConfigFile>}
     */
    async getInstanceByType(type, doNotLoad=false) {
      if (!qx.tool.compiler.utils.ConfigFile.$$instances) {
        qx.tool.compiler.utils.ConfigFile.$$instances = [];
      }
      let instances = qx.tool.compiler.utils.ConfigFile.$$instances;
      if (instances[type] === undefined) {
        let typeInfo = qx.tool.ConfigSchemas[type];
        if (typeInfo === undefined) {
          throw new Error(`Config file type '${type} is not defined.`);
        }
        let filePath = path.join(process.cwd(), typeInfo.filename);
        let schemaUrl = qx.tool.ConfigSchemas.schemaBaseUrl + `/v${typeInfo.version}/${typeInfo.filename}`;
        let instance = new qx.tool.compiler.utils.ConfigFile(filePath, schemaUrl, typeInfo.version);
        if (!doNotLoad) {
          await instance.load();
        }
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
      validate: "_validateData",
      nullable: false
    },

    /**
     * Flag to indicate that data has changed and needs to be saved
     */
    dirty: {
      check: "Boolean",
      init: false,
      event: "changeDirty"
    },

    /**
     * Flag to indicate that data has been loaded
     */
    loaded: {
      check: "Boolean",
      init: false,
      event: "changeLoaded"
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
    __schemaUri: null,

    /**
     * The internal schema signature object
     */
    __schemaInfo: null,

    /**
     * Information on the version of the schema, if any
     */
    __schemaVersion: null,

    /**
     * The json-schema object
     */
    __schema: null,

    /**
     * Validates the data against the schema that the model has been initialized with.
     * @param data The config data
     * @private
     */
    _validateData(data) {
      if (!this.__schema) {
        throw new Error(`You must load the model with data first before setting new data!`);
      }
      this.validate(data);
      this.setDirty(true);
    },

    /**
     * Returns the path to the config file
     * @return {String}
     */
    getPath() {
      return this.__path;
    },

    /**
     * Returns the json-schema object
     * @return {Object}
     */
    getSchema() {
      return this.__schema;
    },

    /**
     * Returns the URL of the JSON schema
     * @return {String}
     */
    getSchemaUrl() {
      return this.__schemaUri;
    },

    /**
     * Returns true if the config file exists, false if not
     * @return {Promise<Boolean>}
     */
    async exists() {
      return await fs.existsAsync(this.__path);
    },

    /**
     * Loads the config data into the model. If no argument is given, load from
     * the file given when the instance was created. If an json object is passed,
     * use that data. In both cases, the data is validated against the schema
     * that the model has been initialized with, unless it is missing schema
     * information (for backwards-compatibility).
     * Returns the instance for chaining
     * @param {Object|undefined} data
     * @return {qx.tool.compiler.utils.ConfigFile} Returns the instance for chaining
     */
    async load(data=undefined) {
      if (data === undefined) {
        if (!await fs.existsAsync(this.__path)) {
          throw new Error(`Cannot load config file: ${this.__path} does not exist. Are you in the library root?`);
        }
        data = qx.tool.compiler.utils.Json.parseJson(await fs.readFileAsync(this.__path, "utf8"));
      }
      let dataSchemaInfo = qx.tool.compiler.utils.Json.getSchemaInfo(data);
      if (!dataSchemaInfo) {
        throw new Error(`Invalid data: must conform to json schema at ${this.__schemaUri}!`);
      }
      let dataVersion = semver.coerce(dataSchemaInfo.version);
      let schemaVersion = semver.coerce(this.__schemaVersion);
      if (dataVersion !== schemaVersion) {
        // migrate the data if possible
        data = this._migrateData(data, dataVersion, schemaVersion);
        // re-analyse the schema of the migrated data
        dataSchemaInfo = qx.tool.compiler.utils.Json.getSchemaInfo(data);
      }
      // save schema information
      this.__schema = await qx.tool.compiler.utils.Json.loadJsonAsync(dataSchemaInfo.file);
      this.__schemaInfo = dataSchemaInfo;
      // validate and save
      this.setData(data);
      this.setLoaded(true);
      return this;
    },

    /**
     * Migrates the data to a new schema if possible or throws otherwise
     * @param {Object} data
     * @param {String} dataVersion (Semver)
     * @param {String} schemaVersion (Semver)
     * @return {Object}
     * @private
     */
    _migrateData(data, dataVersion, schemaVersion) {
      let dataMjVer = Number(semver.major(dataVersion));
      let schemaMjVer = Number(semver.major(schemaVersion));
      switch (true) {
        // identical
        case (dataMjVer === schemaMjVer):
          return data;
        // 0->1: add schema id
        case (dataMjVer === 0 && schemaMjVer === 1):
          data.$schema = this.__schemaUri;
          break;
        // throw otherwise
        default:
          throw new Error(`Configuration file schema version mismatch: expected v${schemaMjVer}, found v${dataMjVer}!`);
      }
      this.setDirty(true);
      return data;
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
     * @param options {*?} See https://github.com/jonschlinkert/get-value#options
     * @return {qx.tool.compiler.utils.ConfigFile} Returns the instance for chaining
     */
    setValue(prop_path, value, options) {
      let data = this.getData();
      let originalValue = this.getValue(prop_path);
      set_value(data, prop_path, value, options);
      try {
        this.validate(data);
      } catch (e) {
        set_value(data, prop_path, originalValue, options);
        throw e;
      }
      this.setDirty(true);
      return this;
    },

    /**
     * Transforms a value at a given property path, using a function.
     * @param prop_path {String|Array}
     *    The property path. See https://github.com/jonschlinkert/set-value#usage
     * @param transformFunc {Function}
     *    The transformation function, which receives the value of the property
     *    and returns the transformed value, which then is validated and saved.
     * @return {qx.tool.compiler.utils.ConfigFile} Returns the instance for chaining
     */
    transform(prop_path, transformFunc) {
      let transformedValue = transformFunc(this.getValue(prop_path));
      if (transformedValue === undefined) {
        throw new Error("Return value of transformation fuction must be undefined.");
      }
      this.setValue(prop_path, transformedValue);
      return this;
    },

    /**
     * Validates the stored model data or the passed object, if given.
     * @param data {Object|undefined} If not given, validate stored data.
     */
    validate(data) {
      data = data || this.getData();
      let dataSchemaInfo = qx.tool.compiler.utils.Json.getSchemaInfo(data);
      if (!dataSchemaInfo && this.__schemaInfo) {
        throw new Error(`Invalid data: must conform to json schema at ${this.__schemaUri}!`);
      }
      if (dataSchemaInfo.uri !== this.__schemaUri) {
        throw new Error(`Invalid schema: expected ${this.__schemaUri}, got ${dataSchemaInfo.uri}`);
      }
      try {
        qx.tool.compiler.utils.Json.validate(data, this.__schema);
      } catch (e) {
        let msg = `Error validating data for ${this.__path}: ${e.message}`;
        throw new Error(msg);
      }
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
      // re-validate to catch invalid changes to object properties
      this.validate();
      await qx.tool.compiler.utils.Json.saveJsonAsync(this.__path, this.getData());
    }
  }
});
