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

var fs = require("fs");
var path = require("path");
var async = require("async");
require("@qooxdoo/framework");
var util = require("../util");
var jsonlint = require("jsonlint");

var log = util.createLog("resource-manager");

require("./ImageHandler");
require("./MetaHandler");
require("./ScssHandler");


/**
 * Analyses library resources, collecting information into a cached database
 * file
 */
qx.Class.define("qx.tool.compiler.resources.Manager", {
  extend: qx.core.Object,

  /**
   * Constructor
   *
   * @param dbFilename
   *          {String?} database filename, default is "resource-db.json"
   */
  construct: function(analyser) {
    this.base(arguments);
    this.__analyser = analyser;
    this.__dbFilename = analyser.getResDbFilename() || "resource-db.json";
    this.__loaders = [
      new qx.tool.compiler.resources.ImageLoader(),
      new qx.tool.compiler.resources.MetaLoader()
    ];
    this.__converters = [
      new qx.tool.compiler.resources.ScssCompiler()
    ];
  },

  members: {
    /** {String} filename of database */
    __dbFilename: null,

    /** {Object} Database */
    __db: null,

    /** the used analyser */
    __analyser: null,

    /** {Map{String,Library}} Lookup of libraries, indexed by resource URI */
    __librariesByResourceUri: null,

    /** {String[]} Array of all resource URIs, sorted alphabetically (ie these are the keys in __librariesByResourceUri) */
    __allResourceUris: null,

    /** {ResourceLoader[]} list of resource loaders, used to add info to the database */
    __loaders: null,

    /** {ResourceConverter[]} list of resource converters, used to copy resources to the target */
    __converters: null,

    /**
     * Loads the cached database
     *
     * @param callback
     */
    loadDatabase: function(callback) {
      var t = this;
      async.waterfall([
        function readDb(callback) {
          fs.exists(t.__dbFilename, function(exists) {
            if (exists) {
              fs.readFile(t.__dbFilename, {
                encoding: "utf-8"
              }, callback);
            } else {
              callback(null, null);
            }
          });
        },

        function parseDb(data, callback) {
          t.__db = data && data.trim().length ? jsonlint.parse(data) : {};
          callback(null, t.__db);
        }
      ], callback);
    },

    /**
     * Saves the database
     *
     * @param callback
     * @async
     */
    saveDatabase: function(callback) {
      log.debug("saving resource manager database");
      return qx.tool.utils.Json.saveJsonAsync(this.__dbFilename, this.__db);
    },

    /**
     * Returns the loaded database
     *
     * @returns
     */
    getDatabase: function() {
      return this.__db;
    },

    /**
     * Finds the library needed for a resource; this depends on `findAllResources` having
     * already been called.  `uri` can include optional explicit namespace (eg "qx:blah/blah.png"),
     * otherwise the library resource lookups are examined to find the library.
     *
     * @param uri {String} URI
     * @return {Library?} the library, null if not found
     */
    findLibraryForResource: function(uri) {
      var t = this;

      // Explicit library?
      var pos = uri.indexOf(":");
      if (pos !== -1) {
        var ns = uri.substring(0, pos);
        var library = this.__analyser.findLibrary(ns);
        return library || null;
      }

      // Non-wildcards are a direct lookup
      // check for $ and *. less pos wins
      // fix for https://github.com/qooxdoo/qooxdoo-compiler/issues/260
      var pos1 = uri.indexOf("$"); // Variable references are effectively a wildcard lookup
      var pos2 = uri.indexOf("*");
      if (pos1 === -1) {
        pos = pos2;
      } else if (pos2 === -1) {
        pos = pos1;
      } else {
        pos = Math.min(pos1, pos2);
      }
      if (pos === -1) {
        library = t.__librariesByResourceUri[uri] || null;
        return library;
      }

      // Strip wildcard
      var isFolderMatch = uri[pos - 1] === "/";
      uri = uri.substring(0, pos - 1);

      // Fast folder match
      if (isFolderMatch) {
        library = t.__librariesByResourceUri[uri] || null;
        return library;
      }

      // Slow scan
      pos = qx.tool.utils.Values.binaryStartsWith(t.__allResourceUris, uri);
      if (pos > -1) {
        var firstUri = t.__allResourceUris[pos];
        library = t.__librariesByResourceUri[firstUri] || null;
        return library;
      }

      return null;
    },

    /**
     * Scans all libraries looking for resources; this does not analyse the
     * files, simply compiles the list
     *
     * @param callback
     */
    async findAllResources() {
      var t = this;
      var db = this.__db;
      if (!db.resources) {
        db.resources = {};
      }
      t.__librariesByResourceUri = {};
      this.__assets = {};
      
      await qx.Promise.all(t.__analyser.getLibraries().map(library => {
        var resources = db.resources[library.getNamespace()];
        if (!resources) {
          db.resources[library.getNamespace()] = resources = {};
        }
        var unconfirmed = {};
        for (let relFile in resources) {
          unconfirmed[relFile] = true;
        }
        
        const scanResources = (resourcePath, doNotCopy) => {
          // If the root folder exists, scan it
          var rootDir = path.join(library.getRootDir(), library.get(resourcePath));
          await qx.tool.utils.files.Utils.findAllFiles(rootDir, filename => {
            var relFile = filename.substring(rootDir.length + 1).replace(/\\/g, "/");
            var fileInfo = resources[relFile];
            delete unconfirmed[relFile];
            if (!fileInfo) {
              fileInfo = resources[relFile] = {};
            }
            fileInfo.doNotCopy = doNotCopy;
            fileInfo.resource = resourcePath;
            fileInfo.mtime = await qx.tool.utils.files.Utils.safeStat(filename).mtime;
            let asset = this.__assets[filename] = new qx.tool.compiler.resources.Asset(library, filename, fileInfo);
            
            let tmp = "";
            filename.split('/').forEach(seg => {
              if (tmp.length) {
                tmp += "/";
              }
              tmp += seg;
              t.__librariesByResourceUri[tmp] = library;
            });

            asset.setLoaders(t.__loaders.filter(loader => loader.matches(filename)));
            asset.setConverters(t.__converters.filter(converter => converter.matches(filename)));
          });
        };
        
        await scanResources("resourcePath", false);
        await scanResources("themePath", true);
        
        // Check the unconfirmed resources to make sure that they still exist;
        //  delete from the database if they don't
        await qx.Promise.all(Object.keys(unconfirmed).map(async filename => {
          let fileInfo = resources[filename];
          if (!fileInfo) {
            delete resources[filename];
          } else {
            let rootDir = path.join(library.getRootDir(), library.get(fileInfo.resourcePath));
            let stat = await qx.tool.utils.files.Utils.safeStat(filename);
            if (!stat) {
              delete resources[filename];
            }
          }
        }));
      }));
      
      await qx.tool.utils.Promisify.promisePool(this.__assets, 10, asset => {
        asset.load();
      });
    },

    /**
     * Collects information about the assets listed in srcPaths;
     * @param srcPaths
     */
    exportAssets: function(target, srcPaths) {
      var t = this;
      var db = this.__db;
      
      srcPaths.forEach(srcPath => {
        
      });

      // Generate a lookup that maps the resource name to the meta file that
      //  contains the composite
      var metas = {};
      for (var libraryName in db.resources) {
        var libraryData = db.resources[libraryName];
        for (var resourcePath in libraryData) {
          var fileInfo = libraryData[resourcePath];
          if (!fileInfo.meta) {
            continue;
          }
          for (var altPath in fileInfo.meta) {
            metas[altPath] = resourcePath;
          }
        }
      }

      // Collect a list of assets
      var assets = [];
      var assetPaths = {};

      function addAsset(library, resourceName) {
        if (assetPaths[resourceName] !== undefined) {
          return;
        }

        var libraryData = db.resources[library.getNamespace()];
        var fileInfo = libraryData[resourceName];
        if (fileInfo.doNotCopy === true) {
          return;
        }
        var asset = {
          libraryName: library.getNamespace(),
          filename: resourceName,
          fileInfo: fileInfo
        };

        // Does this have meta data for a composite?
        var metaPath = metas[resourceName];
        if (metaPath !== null) {
          var metaInfo = libraryData[metaPath];
          if (metaInfo) {
            // Extract the fragment from the meta data for this particular resource
            var resMetaData = metaInfo.meta[resourceName];
            fileInfo.composite = resMetaData[3];
            fileInfo.x = resMetaData[4];
            fileInfo.y = resMetaData[5];
            if (!assetPaths[metaPath]) {
              srcPaths.push(metaPath);
            }
          }
        }
        assets.push(asset);
        assetPaths[resourceName] = assets.length - 1;
      }

      for (var i = 0; i < srcPaths.length; i++) {
        var srcPath = srcPaths[i];
        var library = t.findLibraryForResource(srcPath);
        if (!library) {
          t.warn("Cannot find library for " + srcPath);
          continue;
        }

        var pos = srcPath.indexOf(":");
        if (pos > -1) {
          srcPath = srcPath.substring(pos + 1);
        }

        libraryData = db.resources[library.getNamespace()];
        pos = srcPath.indexOf("*");
        if (pos > -1) {
          srcPath = srcPath.substring(0, pos);
          for (var resourceName in libraryData) {
            if (resourceName.substring(0, srcPath.length) == srcPath) {
              addAsset(library, resourceName);
            }
          }
        } else {
          fileInfo = libraryData[srcPath];
          if (fileInfo && (fileInfo.doNotCopy !== true)) {
            addAsset(library, srcPath);
          }
        }
      }

      return assets;
    },
    
    async copyResource(target, library, filename, fileInfo) {
      let converters = this.__converters.filter(converter => converter.matches(filename));
      if (converters.length == 0) {
        return qx.tool.utils.files.Utils.sync(library.getResourceFilename(filename),
            path.join(t.getOutputDir(), "resource", filename));
      } else if (converters.length == 1) {
        converters[0].convert(target, library, filename, fileInfo)
      } else {
        throw new Error("Multiple resource converters found for " + filename + " in " + library.getNamespace());
      }
    }
  }
});

module.exports = qx.tool.compiler.resources.Manager;
