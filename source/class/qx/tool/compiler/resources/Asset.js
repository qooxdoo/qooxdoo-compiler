const path = require("path");

qx.Class.define("qx.tool.compiler.resources.Asset", {
  extend: qx.core.Object,
  
  construct: function(library, filename, fileInfo) {
    this.base(arguments);
    this.__library = library;
    this.__filename = filename;
    this.__fileInfo = fileInfo;
  },
  
  members: {
    /** {Library} that this asset belongs to */
    __library: null,
    
    /** {String} path within the library resources */
    __filename: null,
    
    /** {Object} the data in the database */
    __fileInfo: null,
    
    /** {ResourceLoader[]?} array of loaders */
    __loaders: null,
    
    /** {ResourceConverter[]?} array of converters */
    __converters: null,
    
    /** {Asset[]?} list of assets which refer to this asset (eg for image combining) */
    __metaReferees: null,
    
    /** {Asset[]?} list of assets which the meta in this asset refers to (eg for image combining) */
    __metaReferTo: null,
    
    /** {Asset[]?} list of assets which this asset depends on */
    __dependsOn: null,
    
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
      return path.relative(process.cwd(), this.__library.getResourceFilename(this.__filename));
    },
    
    getDestFilename(target) {
      let filename = null;
      if (this.__converters) {
        filename = this.__converters[this.__converters.length - 1].getDestFilename(target, this);
      }
      return filename ? filename : path.relative(process.cwd(), path.join(target.getOutputDir(), "resource", this.__filename));
    },
    
    setLoaders(loaders) {
      this.__loaders = loaders.length ? loaders : null;
    },
    
    setConverters(converters) {
      this.__converters = converters.length ? converters : null;
    },
    
    addMetaReferee(asset) {
      if (!this.__metaReferees)
        this.__metaReferees = [];
      if (!qx.lang.Array.contains(this.__metaReferees, asset))
        this.__metaReferees.push(asset);
    },
    
    getMetaReferees() {
      return this.__metaReferees;
    },
    
    addMetaReferTo(asset) {
      if (!this.__metaReferTo)
        this.__metaReferTo = [];
      if (!qx.lang.Array.contains(this.__metaReferTo, asset))
        this.__metaReferTo.push(asset);
    },
    
    getMetaReferTo() {
      return this.__metaReferTo;
    },
    
    setDependsOn(assets) {
      if (assets) {
        this.__dependsOn = assets;
        this.__fileInfo.dependsOn = assets.map(asset => asset.toUri());
      } else {
        this.__dependsOn = null;
        delete this.__fileInfo.dependsOn;
      }
    },
    
    getDependsOn() {
      return this.__dependsOn;
    },
    
    async load() {
      if (this.__loaders) {
        this.__loaders.forEach(loader => loader.load(this));
      }
    },
    
    async sync(target) {
      let destFilename = this.getDestFilename(target);
      let srcFilename = this.getSourceFilename();
      
      if (this.__converters) {
        let doNotCopy = await qx.tool.utils.Promisify.some(this.__converters, converter => converter.isDoNotCopy(srcFilename));
        if (doNotCopy)
          return;
      }
      
      let destStat = await qx.tool.utils.files.Utils.safeStat(destFilename);
      if (destStat) {
        let filenames = [ this.__filename ];
        if (this.__dependsOn) {
          this.__dependsOn.forEach(asset => filenames.push(asset.getSourceFilename()));
        }
        let needsIt = await qx.tool.utils.Promisify.some(filenames, async filename => {
          let srcTmp = path.join(this.__library.getResourceFilename(filename));
          let srcStat = await qx.tool.utils.files.Utils.safeStat(srcTmp);
          return srcStat && srcStat.mtime.getTime() > destStat.mtime.getTime();
        });
        if (!needsIt && this.__converters) {
          needsIt = await qx.tool.utils.Promisify.some(this.__converters, converter => converter.needsConvert(target, this, srcFilename, destFilename)); 
        }
        if (!needsIt) {
          return;
        }
      }
      
      await qx.tool.utils.Utils.makeParentDir(destFilename);
      
      if (this.__converters) {
        if (this.__converters.length == 1) {
          await this.__converters[0].convert(target, this, srcFilename, destFilename);
        } else {
          let lastTempFilename = null;
          qx.tool.utils.Promisify.each(this.__converters, async (converter, index) => {
            let tmpSrc = lastTempFilename ? lastTempFilename : srcFilename;
            let tmpDest = index === this.__converters.length - 1 ? 
                destFilename : 
                path.join(os.tmpdir(), path.basename(srcFilename) + "-pass" + (i + 1) + "-");
            await converter.convert(target, this, tmpSrc, tmpDest);
            lastTempFilename = tmpDest;
          });
        }
      } else {
        await qx.tool.utils.files.Utils.copyFile(srcFilename, destFilename);
      }
    },
    
    toUri() {
      return this.__library.getNamespace() + ":" + this.__filename;
    },
    
    toString() {
      return this.toUri();
    }
  }
});