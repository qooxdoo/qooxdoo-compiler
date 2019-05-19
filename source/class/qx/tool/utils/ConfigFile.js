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

const fs = qx.tool.utils.Promisify.fs;
const process = require("process");
const path = require("path");
const semver = require("semver");
const get_value = require("get-value");
const set_value = require("set-value");

/**
 * A model for config files
 */
qx.Class.define("qx.tool.utils.ConfigFile", {
  extend: qx.core.Object,

  statics: {

    $$instances: null,

    /**
     * Factory function to create singletons of a config file model
     * @param {String} type
     * @param {Boolean} doNotLoad If true, don't load the model yet. Default: false
     * @return {Promise<qx.tool.utils.ConfigFile>}
     */
    async getInstanceByType(type, doNotLoad=false) {
      if (!qx.tool.utils.ConfigFile.$$instances) {
        qx.tool.utils.ConfigFile.$$instances = [];
      }
      let instances = qx.tool.utils.ConfigFile.$$instances;
      let id = process.cwd() + "|" + type;
      if (instances[id] === undefined) {
        let typeInfo = qx.tool.ConfigSchemas[type];
        if (typeInfo === undefined) {
          throw new Error(`Config file type '${type} is not defined.`);
        }
        let filePath = path.join(process.cwd(), typeInfo.filename);
        let commonPath = `/v${typeInfo.version}/${typeInfo.filename}`;
        let schemaUri = qx.tool.ConfigSchemas.schemaBaseUrl + commonPath;
        let schemaPath = path.join(qx.tool.ConfigSchemas.schemaBaseDir, commonPath);
        let instance = new qx.tool.utils.ConfigFile(filePath, schemaUri, schemaPath, typeInfo.version);
        if (!doNotLoad) {
          await instance.load();
        }
        instances[id] = instance;
      }
      return instances[id];
    }
  },

  /**
   * Constructor
   * @param {String} dataPath
   * @param {String} schemaUri
   *    URI that uniquely identifies the schema.
   *    Should be an URL from which the schema JSON can be downloaded.
   * @param {String|undefined} schemaPath
   *    Path to a local copy of the schema json.
   * @param {String|undefined} schemaVersion
   *    The version of the schema
   */
  construct: function(dataPath, schemaUri, schemaPath, schemaVersion) {
    if (!dataPath || !schemaUri || !schemaPath || !schemaVersion) {
      throw new Error("Missing parameter.");
    }
    this.__dataPath = dataPath;
    this.__schemaUri = schemaUri;
    this.__schemaPath = schemaPath;
    this.__schemaVersion = schemaVersion;
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
    __dataPath: null,

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
     * Path to the local copy of the schema json file
     */
    __schemaPath: null,

    /**
     * The json-schema object
     */
    __schema: null,

    /**
     * Validates the given data against the schema that the model has been
     * initialized with. Throws if not valid.
     * @param data The config data
     * @private
     */
    _validateData(data) {
      if (!this.__schema) {
        throw new Error(`Cannot validate - no schema available! Please load the model first.`);
      }
      if (data.$schema !== this.__schemaUri) {
        throw new Error(`Invalid schema: expected ${this.__schemaUri}, got ${data.$schema}`);
      }
      try {
        qx.tool.utils.Json.validate(data, this.__schema);
      } catch (e) {
        let msg = `Error validating data for ${this.__dataPath}: ${e.message}`;
        throw new Error(msg);
      }
    },

    /**
     * Returns the path to the config file
     * @return {String}
     */
    getPath() {
      return this.__dataPath;
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
     * Returns the version of the JSON schema
     * @return {String}
     */
    getSchemaVersion() {
      return this.__schemaVersion;
    },

    /**
     * Returns true if the config file exists, false if not
     * @return {Promise<Boolean>}
     */
    async exists() {
      return await fs.existsAsync(this.__dataPath);
    },

    /**
     * Loads the config data into the model. If no argument is given, load from
     * the file given when the instance was created. If an json object is passed,
     * use that data. In both cases, the data is validated against the schema
     * that the model has been initialized with, unless it is missing schema
     * information (for backwards-compatibility).
     * Returns the instance for chaining
     * @param {Object|undefined} data
     * @return {qx.tool.utils.ConfigFile} Returns the instance for chaining
     */
    async load(data=undefined) {
      // load data
      if (data === undefined) {
        if (!await fs.existsAsync(this.__dataPath)) {
          throw new Error(`Cannot load config file: ${this.__dataPath} does not exist. Are you in the library root?`);
        }
        data = qx.tool.utils.Json.parseJson(await fs.readFileAsync(this.__dataPath, "utf8"));
      }
      // load schema
      if (!this.__schema) {
        if (!fs.existsSync(this.__schemaPath)) {
          throw new Error(`No schema file exists at ${this.__schemaPath}`);
        }
        this.__schema = await qx.tool.utils.Json.loadJsonAsync(this.__schemaPath);
      }
      // check initial data
      let dataSchemaInfo = qx.tool.utils.Json.getSchemaInfo(data);
      if (!dataSchemaInfo) {
        throw new Error(`Invalid data: must conform to json schema at ${this.__schemaUri}!`);
      }
      let dataVersion = semver.coerce(dataSchemaInfo.version);
      let schemaVersion = semver.coerce(this.__schemaVersion);
      if (dataVersion !== schemaVersion) {
        // migrate the data if possible
        data = this._migrateData(data, dataVersion, schemaVersion);
      }
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
     * @return {qx.tool.utils.ConfigFile} Returns the instance for chaining
     */
    setValue(prop_path, value, options) {
      let originalValue = this.getValue(prop_path);
      set_value(this.getData(), prop_path, value, options);
      try {
        this.validate();
      } catch (e) {
        // revert value
        set_value(this.getData(), prop_path, originalValue, options);
        // throw
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
     * @return {qx.tool.utils.ConfigFile} Returns the instance for chaining
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
     * Validates the stored config model data. Used when data is changed
     * outside of the API
     */
    validate() {
      this._validateData(this.getData());
    },

    /**
     * Save the data to the config file
     * @return {Promise<void>}
     */
    async save() {
      this.validate();
      await qx.tool.utils.Json.saveJsonAsync(this.__dataPath, this.getData());
    }
  }
});
