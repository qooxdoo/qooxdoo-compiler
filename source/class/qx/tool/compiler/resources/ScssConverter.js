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
 *      * Henner Kollmann (henner.kollmann@gmx.de)
 *
 * *********************************************************************** */

var path = require("path");
var sass = require("node-sass");
const fs = qx.tool.utils.Promisify.fs;

qx.Class.define("qx.tool.compiler.resources.ScssConverter", {
  extend: qx.tool.compiler.resources.ResourceConverter,

  construct: function() {
    this.base(arguments, ".scss");
  },

  members: {
    isDoNotCopy(filename) {
      return path.basename(filename)[0] === "_";
    },
    
    getDestFilename(target, asset) {
      let filename;
      if (asset.isThemeFile()) {
        filename = path.join(target.getOutputDir(), "resource", asset.getFilename().replace(/\bscss\b/g, "css"));
      } else {
        filename = path.join(target.getOutputDir(), "resource", asset.getFilename().replace(/\.scss$/, ".css"));
      }
      return filename;
    },
    
    async convert(target, asset, srcFilename, destFilename) {
      if (asset.isThemeFile()) {
        return this.legacyMobileSassConvert(target, asset, srcFilename, destFilename);
      }
      
      let scssFile = new qx.tool.compiler.resources.ScssFile(target, asset.getLibrary(), asset.getFilename());
      return scssFile.compile(destFilename);
    },
    
    /**
     * The traditional SASS compilation; it does not use the newer advanced SASS compiler and so
     * does not support relative `url()` paths and automatically has Qooxdoo SASS built in.
     */
    async legacyMobileSassConvert(target, asset, srcFilename, destFilename) {
      let qooxdooPath = target.getAnalyser().getQooxdooPath();
      let data = await fs.readFileAsync(srcFilename, "utf8");
      let sassOptions = {
        data: data,
        includePaths: [
          path.dirname(srcFilename),
          path.join(qooxdooPath, "source/resource/qx/mobile/scss"),
          path.join(qooxdooPath, "source/resource/qx/scss")
        ],
        outFile: destFilename,
        sourceMap: destFilename + ".map",
        outputStyle: "compressed"
      };
      let result = await qx.tool.utils.Promisify.call(cb => sass.render(sassOptions, cb));
      await fs.writeFileAsync(destFilename, result.css);
      await fs.writeFileAsync(destFilename + ".map", result.map);
    }
  }
});
