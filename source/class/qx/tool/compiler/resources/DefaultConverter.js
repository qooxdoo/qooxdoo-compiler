/* ************************************************************************
 *
 *    qooxdoo-compiler - node.js based replacement for the Qooxdoo python
 *    toolchain
 *
 *    https://github.com/qooxdoo/qooxdoo-compiler
 *
 *    Copyright:
 *      2011-2017 Zenesis Limited, http://www.zenesis.com
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

/**
 * Instances of ResourceConverter are used by the resource manager to transfer resources into
 * the target output, where they require something more than just copying (eg SCSS compilation)
 */
qx.Class.define("qx.tool.compiler.resources.DefaultConverter", {
  extend: qx.tool.compiler.resources.ResourceConverter,
  
  members: {
    matches: function(filename) {
      return true;
    },

    /**
     * Allows a file to be recompiled/coverted/analysed/ etc; must return a Promise which resolves
     * when complete.  Data can be stored in the resource database by modifying the fileInfo
     * 
     * @param filename {String} absolute path to the file
     * @param library {Library} library which contains the resource
     * @param fileInfo {Map} this is the object in the resource database, contains info about the resource;
     *  guaranteed to not be null
     *  @return {Promise}
     */
    async convert(target, library, filename, fileInfo) {
      throw new Error("No implementation for " + this.classname + ".convert");
    }
  }
});
