/**
 * @ignore(require)
 */
const fs = qx.tool.utils.Promisify.fs;
const path = require('path');
const nodeSass = require('node-sass');

/**
 * @ignore(process)
 */
qx.Class.define("qx.tool.compiler.resources.ScssFile", {
  extend: qx.core.Object,
  
  construct(target, library, filename) {
    this.base(arguments);
    this.__library = library;
    this.__filename = filename;
    this.__target = target;
    this.__sourceFiles = {};
  },
  
  properties: {
    file: {
      nullable: false,
      check: "String",
      event: "changeFile"
    }
  },
  
  members: {
    __library: null,
    __filename: null,
    __outputDir: null,
    __absLocations: null,
    __sourceFiles: null,
    
    compile(outputFilename) {
      this.__outputDir = path.dirname(outputFilename);
      this.__absLocations = {};
      
      return this.loadSource(this.__filename, this.__library)
        .then(inputFileData => {
          inputFileData = 
            `
            @function qooxdooUrl($url) { 
              @return __qooxdooUrlImpl($__library, $__filename, $url); 
            }
            ` + inputFileData;
          
          return new qx.Promise((resolve, reject) => {

            nodeSass.render({
              // Always have file so that the source map knows the name of the original
              file: this.__filename,
              
              // data provides the contents, `file` is only used for the sourcemap filename
              data: inputFileData,
              
              outputStyle: 'compressed',
              sourceMap: true,
              outFile: path.basename(outputFilename),
              
              /*
               * Importer
               */
              importer: (url, prev, done) => {
                let contents = this.__sourceFiles[url];
                return contents ? { contents } : null;
              },
              
              functions: {
                "__qooxdooUrlImpl($library, $filename, $url)": ($library, $filename, $url, done) =>
                  this.__qooxdooUrlImpl($library, $filename, $url, done)
              }
            }, 
            (error, result) =>{
              if (error) {
                this.error("Error status " + error.status + " in " + this.__filename + "[" + error.line + "," + error.column + "]: " + error.message);
                return resolve(error); // NOT reject
              }

              fs.writeFileAsync(outputFilename, result.css.toString(), "utf8")
                .then(() => fs.writeFileAsync(outputFilename + ".map", result.map.toString(), "utf8"))
                .then(() => resolve(null))
                .catch(reject);
            });
          });
        });
    },
    
    _analyseFilename(library, url, currentFilename) {
      var m = url.match(/^([a-z0-9_]+):(\/?[^\/].*)/);
      if (m) {
        return {
          namespace: m[1],
          filename: m[2],
          externalUrl: null
        };
      } else {
        // It's a real URL like http://abc.com/..
        if (url.match(/^[a-z0-9_]+:\/\//)) {
          return { 
            externalUrl: url 
          };
        }
        
        // It's either absolute to the website (i.e. begins with a slash) or it's
        //  relative to the current file
        if (url[0] == "/") {
          return {
            namespace: null,
            filename: url
          };
        }
        
        // Must be relative to current file
        let dir = path.dirname(currentFilename);
        let filename = path.resolve(dir, url);
        let library = this.__target.getAnalyser().getLibraries().find(library => filename.startsWith(path.resolve(library.getRootDir())));
        if (!library) {
          this.error("Cannot find library for " + url + " in " + currentFilename);
          return null;
        }
        
        let libResourceDir = path.join(library.getRootDir(), library.getResourcePath())
        return {
          namespace: library.getNamespace(),
          filename: path.relative(libResourceDir, filename),
          externalUrl: null
        };
      }
    },
    
    reloadSource(filename) {
      filename = path.resolve(filename);
      delete this.__sourceFiles[filename];
      return this.loadSource(filename);
    },
    
    async loadSource(filename, library) {
      function esc(str) {
        return str.replace(/([\[\]\\])/g, '\\$1');
      }
      
      filename = path.relative(process.cwd(), path.resolve(library.getResourceFilename(filename)));
      let absFilename = filename;
      if (path.extname(absFilename) == "")
        absFilename += ".scss";
      
      let exists = fs.existsSync(absFilename)
      if (!exists) {
        let name = path.basename(absFilename);
        if (name[0] != "_") {
          let tmp = path.join(path.dirname(absFilename), "_" + name);
          exists = fs.existsSync(tmp);
          if (exists)
            absFilename = tmp;
        }
      }
      if (!exists) {
        this.__sourceFiles[absFilename] = null;
        return null;
      }
      
      if (this.__sourceFiles[absFilename] !== undefined)
        return qx.Promise.resolve(this.__sourceFiles[absFilename]);
      
      let contents = await fs.readFileAsync(absFilename, "utf8");
      let promises = [];
      contents = contents.replace(/@import\s+["']([^;]+)["']/ig, (match, p1, offset) => {
        let pathInfo = this._analyseFilename(library, p1, absFilename);
        if (pathInfo.externalUrl) {
          return "@import \"" + pathInfo.externalUrl + "\"";
        }
        let newLibrary = this.__target.getAnalyser().findLibrary(pathInfo.namespace);
        if (!newLibrary) {
          this.error("Cannot find file to import, url=" + p1 + " in file " + absFilename);
          return;
        }
        promises.push(this.loadSource(pathInfo.filename, newLibrary));
        return "@import \"" + path.relative(process.cwd(), newLibrary.getResourceFilename(pathInfo.filename)) + "\"";
      });
      
      contents = contents.replace(/\burl\s*\(\s*([^\)]+)*\)/ig, (match, p1) => {
        let c = p1[0];
        if (c === '\'' || c === '\"')
          p1 = p1.substring(1);
        c = p1[p1.length - 1];
        if (c === '\'' || c === '\"')
          p1 = p1.substring(0, p1.length - 1);
        return "qooxdooUrl(\"" + p1 + "\")";
      });

      contents = [
        '//===================================================',
        '$__dirname:  "'+esc(path.dirname(filename))+'";',
        '$__library:  "'+esc(library.getNamespace())+'";',
        '$__filename: "'+esc(filename)+'";',
        '//===================================================',
        contents,
        '//===================================================',
        '$__dirname:  "__null__";',
        '$__library:  "__null__";',
        '$__filename: "__null__";',
        '//==================================================='
      ].join('\n');
      this.__sourceFiles[filename] = contents;
      
      await qx.Promise.all(promises);
      return contents;
    },
    
    getSourceFilenames() {
      return Object.keys(this.__sourceFiles);
    },
    
    __qooxdooUrlImpl($libraryNamespace, $filename, $url, done) {
      let library = this.__target.getAnalyser().findLibrary($libraryNamespace.getValue());
      let currentFilename = $filename.getValue();
      let url = $url.getValue();
      
      let pathInfo = this._analyseFilename(library, url, currentFilename);
      
      if (pathInfo.externalUrl) {
        return nodeSass.types.String("url(" + pathInfo.externalUrl + ")");
      }
      
      if (pathInfo.namespace) {
        let targetLibrary = this.__target.getAnalyser().findLibrary(pathInfo.namespace);
        let targetFile = path.relative(process.cwd(), path.join(this.__target.getOutputDir(), "resource", pathInfo.filename))
        let relative = path.relative(this.__outputDir, targetFile);
        return nodeSass.types.String("url(" + relative + ")");
      } else {
        return nodeSass.types.String("url(" + url + ")");
      }
    }    
  }
});
