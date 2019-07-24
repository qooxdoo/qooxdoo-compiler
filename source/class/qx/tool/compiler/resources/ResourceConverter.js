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
qx.Class.define("qx.tool.compiler.resources.ResourceConverter", {
  extend: qx.core.Object,
  type: "abstract",
  
  /**
   * Constructor
   * 
   * @param matchEx {RegEx?} the reg ex to match filenames
   */
  construct: function(matchEx) {
    this.base(arguments);
    this.__matchEx = matchEx||null;
  },
  
  members: {
    __matchEx: null,

    /**
     * Called to determine whether this handler is appropriate for the given filename;
     * default implementation is to check the RegEx passed to the constructor
     */
    matches: function(filename) {
      return this.__matchEx !== null && this.__matchEx.test(filename);
    },
    
    async analyseFilename(target, library, filename, fileInfo) {
      let srcFilename = path.join(library.getResourceFilename(filename));
      let destFilename = path.join(target.getOutputDir(), "resource", filename);
      let srcStat = qx.tool.utils.files.Utils.safeStat(srcFilename);
      let destStat = qx.tool.utils.files.Utils.safeStat(destFilename);
      
      return {
        source: {
          filename: srcFilename,
          stat: srcStat
        },
        dest: {
          filename: destFilename,
          stat: destStat
        },
        fileInfo
      }
    },

    /**
     * Detects whether the file needs to be recompiled/coverted/analysed/ etc; this should
     * not take any time or be asynchronous, if you need to do any real work it should be 
     * in `compile` because that is throttled.
     * 
     * @param filename {String} absolute path to the file
     * @param fileInfo {Map?} this is the object in the resource database, contains info about the resource;
     *  this will be null if not yet in the resource database
     * @param stat {fs.Stats} Stats object from fs.stat
     * 
     * @return {Boolean}
     */
    async needsConvert(target, library, filename, fileInfo) {
      if (this.matches(filename)) {
        let srcFilename = path.join(library.getResourceFilename(filename));
        let srcStat = qx.tool.utils.files.Utils.safeStat(srcFilename);
        if (!srcStat) {
          return false;
        }
        let destFilename = path.join(target.getOutputDir(), "resource", filename);
        let destStat = qx.tool.utils.files.Utils.safeStat(destFilename);
        return !destStat || srcStat.mtime > destStat.mtime;
      }
      return false;
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
