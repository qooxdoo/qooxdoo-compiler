const path = require("path");

qx.Class.define("qx.tool.compiler.resources.Asset", {
  extend: qx.core.Object,
  
  construct(library, filename, fileInfo) {
    this.base(arguments);
    this.__library = library;
    this.__filename = filename;
    this.__fileInfo = fileInfo;
  },
  
  members: {
    __library: null,
    __filename: null,
    __fileInfo: null,
    
    getLibrary() {
      return this.__library;
    },
    
    getFilename() {
      return this.__filename;
    },
    
    getFileInfo() {
      return this.__fileInfo;
    },
    
    getSourceFilename() {
      return path.join(this.__library.getResourceFilename(this.__filename));
    },
    
    getDestFilename(target) {
      return path.join(target.getOutputDir(), "resource", this.__filename);
    },
    
    needsCopy(target) {
      let destFilename = this.getDestFilename();
      let destStat = qx.tool.utils.files.Utils.safeStat(destFilename);
      if (!destStat)
        return true;
      
      let filenames = [ this.__filename ];
      if (this.__fileInfo.dependsOn) {
        this.__fileInfo.dependsOn.forEach(filename => filenames.push(filename));
      }
      let needsIt = filenames.some(filename => {
        let srcFilename = path.join(library.getResourceFilename(filename));
        let srcStat = qx.tool.utils.files.Utils.safeStat(srcFilename);
        return srcStat && srcStat.mtime > destStat.mtime;
      });
      return needsIt;
    }
  }
});