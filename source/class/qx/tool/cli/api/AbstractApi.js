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
 * Base class for the compiler API classes
 */
qx.Class.define("qx.tool.cli.api.AbstractApi", {
  extend: qx.core.Object,
  
  properties: {
    rootDir: {
      check: "String",
      nullable: false
    }
  },
  
  members: {
    /**
     * Called by the compiler API during initialisation - this is an ideal
     * place to install additional commands, because a command has not yet
     * been selected 
     */
    async initialize() {
      // Nothing
    }
  }
});

