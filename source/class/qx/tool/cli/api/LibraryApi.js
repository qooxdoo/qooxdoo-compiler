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
const fs = require("fs");      

/**
 * Provides an API for an individual library
 */
qx.Class.define("qx.tool.cli.api.LibraryApi", {
  extend: qx.tool.cli.api.AbstractApi,
  
  properties: {
    /** The Compiler API */
    compilerApi: {
      nullable: false,
      check: "qx.tool.cli.api.CompilerApi"
    }
  },
  
  members: {
    /**
     * Called to load any library-specific configuration and update the compilerConfig
     */
    load() {
      // Nothing
    },

    /**
     * Called after all libraries have been loaded and added to the compilation data
     */
    async afterLibrariesLoaded() {
      // Nothing
    },
    
    /**
     * 
     * helper to load an npm module. Check if it can be loaded before
     * If not install the module with 'npm install --no-save --no-package-lock' to the current library
     * 
     * @param module {String} module to check
     */
    require: function(module) {
      let exists = fs.existsSync(path.join(process.cwd(), "node_modules", module));
      if (!exists) {
        this.loadNpmModule(module);
      }      
      return require(module);
    },
    /**
      * 
      * install an npm module with 'npm install --no-save --no-package-lock' to the current library
      * 
      * @param module {String} module to load
      */
    loadNpmModule: function(module) {
      const {execSync} = require("child_process");
      let s = `npm install --no-save --no-package-lock ${module}`;
      qx.tool.compiler.Console.info(s);
      execSync(s, {
        stdio: "inherit"
      });
    }
	
    
  }
});

