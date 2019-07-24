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
var fs = qx.tool.utils.Promisify.fs;

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
      let filename = path.join(target.getOutputDir(), "resource", asset.getFilename().replace(/\.scss$/, ".css"));
      return filename;
    },
    
    async convert(target, asset, srcFilename, destFilename) {
      let qooxdooPath = target.getAnalyser().getQooxdooPath();
      let library = asset.getLibrary();
      let themePath = path.join(library.getRootDir(), library.getThemePath(), srcFilename);
      if (await qx.tool.utils.files.Utils.safeStat(themePath)) {
        return await this.legacyMobileSassConvert(target, asset, srcFilename, destFilename);
      }
      
      let scssFile = new qx.tool.compiler.resources.ScssFile(target, asset.getLibrary(), asset.getFilename());
      await scssFile.compile(destFilename);
    },
    
    /**
     * The traditional SASS compilation; it does not use the newer advanced SASS compiler and so
     * does not support relative `url()` paths and automatically has Qooxdoo SASS built in.
     */
    async legacyMobileSassConvert(target, asset, srcFilename, destFilename) {
      let data = await fs.readFileAsync(srcFilename, "utf8");
      let sassOptions = {
          data: data,
          includePaths: [
            path.dirname(filename),
            path.join(qooxdooPath, "source/resource/qx/mobile/scss"),
            path.join(qooxdooPath, "source/resource/qx/scss")
          ],
          outFile: destName,
          sourceMap: destName + ".map",
          outputStyle: "compressed"
        };
        await qx.tool.utils.Promisify.call(cb => sass.render(sassOptions, cb));
        await fs.writeFileAsync(sassOptions.outFile, data.css);
        await fs.writeFileAsync(sassOptions.sourceMap, data.map);
    }
  }
});
