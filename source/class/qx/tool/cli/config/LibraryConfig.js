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

/**
 * Loads the configuration for a specific library, and updates the 
 * compiler configuration as necessary
 */
qx.Class.define("qx.tool.cli.config.LibraryConfig", {
  extend: qx.tool.cli.config.AbstractConfig,
  
  properties: {
    compilerConfig: {
      nullable: false,
      check: "qx.tool.cli.config.CompilerConfig"
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
    }
    
  }
});

