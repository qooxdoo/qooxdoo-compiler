/* ************************************************************************
 *
 *    qooxdoo-compiler - node.js based replacement for the Qooxdoo python
 *    toolchain
 *
 *    https://github.com/qooxdoo/qooxdoo-compiler
 *
 *    Copyright:
 *      2011-2019 Zenesis Limited, http://www.zenesis.com
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

const path = require("path");
const fs = qx.tool.utils.Promisify.fs;

/**
 * Provides an API for the compiler
 * 
 */
qx.Class.define("qx.tool.cli.api.CompilerApi", {
  extend: qx.tool.cli.api.AbstractApi,
  
  construct: function() {
    this.base(arguments);
    this.__libraryApis = {};
  },
  
  properties: {
    /** Default filename to load from */
    configFilename: {
      check: "String",
      nullable: false
    },
    
    /** Configuration data for the compiler */
    configuration: {
    },
    
    /** The current command */
    command: {
      init: null,
      nullable: true,
      check: "qx.tool.cli.commands.Command",
      event: "changeCommand"
    }
  },

  members: {
    __libraryApis: null,
    
    /**
     * Loads the configuration data
     */
    async load() {
      let compileJsonPath = path.join(this.getRootDir(), this.getConfigFilename());
      let config = {};
      if (await fs.existsAsync(compileJsonPath)) {
        config = await qx.tool.utils.Json.loadJsonAsync(compileJsonPath);
      }
      this.setConfiguration(config);
      return config;
    },
    
    /**
     * Called after all libraries have been loaded and added to the compilation data
     */
    async afterLibrariesLoaded() {
      for (let arr = this.getLibraryApis(), i = 0; i < arr.length; i++) {
        await arr[i].afterLibrariesLoaded();
      }
    },
    
    /**
     * Adds a library configuration
     * 
     * @param libraryApi {LibraryApi} the configuration for the library
     */
    addLibraryApi(libraryApi) {
      let dir = path.resolve(libraryApi.getRootDir());
      this.__libraryApis[dir] = libraryApi;
    },
    
    /**
     * Returns an array of library configurations
     * 
     * @return {LibraryApi[]}
     */
    getLibraryApis() {
      return Object.values(this.__libraryApis);
    }
  }
});

