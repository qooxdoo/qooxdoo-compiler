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
 * Loads and stores the configuration for the entire compiler
 * 
 */
qx.Class.define("qx.tool.cli.config.CompilerConfig", {
  extend: qx.tool.cli.config.AbstractConfig,
  
  construct: function(command) {
    this.base(arguments);
    this.__command = command;
    this.__libraryConfigs = {};
  },
  
  properties: {
    configFilename: {
      init: "compile.json",
      check: "String",
      nullable: false
    }
  },
  
  members: {
    __configPromise: null,
    __libraryConfigs: null,
    
    /**
     * Loads the configuration data
     */
    async load() {
      let compileJsonPath = path.join(this.getRootDir(), this.getConfigFilename());
      let config = {};
      if (await fs.existsAsync(compileJsonPath)) {
        config = await qx.tool.utils.Json.loadJsonAsync(compileJsonPath);
      }
      return config;
    },
    
    /**
     * Returns the configuration data
     */
    getConfiguration() {
      if (this.__configPromise) {
        return this.__configPromise;
      }
      return this.__configPromise = this.load();
    },
    
    /**
     * Returns the command
     * 
     * @return {qx.tool.cli.commands.Command} the CLI command
     */
    getCommand() {
      return this.__command;
    },
    
    /**
     * Called after all libraries have been loaded and added to the compilation data
     */
    async afterLibrariesLoaded() {
      for (let arr = this.getLibraryConfigs(), i = 0; i < arr.length; i++) {
        await arr[i].afterLibrariesLoaded();
      }
    },
    
    /**
     * Adds a library configuration
     * 
     * @param libraryConfig {LibraryConfig} the configuration for the library
     */
    addLibraryConfig(libraryConfig) {
      let dir = path.resolve(libraryConfig.getRootDir());
      this.__libraryConfigs[dir] = libraryConfig;
    },
    
    /**
     * Returns an array of library configurations
     * 
     * @return {LibraryConfig[]}
     */
    getLibraryConfigs() {
      return Object.values(this.__libraryConfigs);
    }
  }
});

