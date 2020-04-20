/**
 * ApplicationMeta collects all the data about an application being compiled by a target, 
 * in a form easily navigated and well documented.  
 * 
 * It provides an abstraction where the target can choose to restructure and reorganise the 
 * output as it progresses - for example, a target may start by assembling a number of 
 * javascript files, and then bundle them together, effectively replacing several files 
 * with just one intermediate file; the target can then replace the intermediate file with 
 * a minified file etc.
 */
qx.Class.define("qx.tool.compiler.targets.meta.ApplicationMeta", {
  extend: qx.core.Object,
  
  construct(target, application) {
    this.base(arguments);
    this.__target = target;
    this.__application = application;
    this.__libraries = [];
    this.__preload = {
      urisBefore: [],
      cssBefore: []
    };
    this.__preBootCode = [];
    this.__resources = {};
    this.__packages = [];
    this.__parts = [];
  },
  
  properties: {
    /** The environment for the build */
    environment: {
      // Any object
    },
    
    appLibrary: {
      check: "qx.tool.compiler.app.Library"
    },
    
    bootMetaJs: {
      check: "qx.tool.compiler.targets.meta.IJavascriptMeta"
    },
    
    sourceUri: {
      check: "String"
    },
    
    resourceUri: {
      check: "String"
    }
  },
  
  members: {
    __target: null,
    __application: null,
    __libraries: null,
    __preload: null,
    __preBootCode: null,
    __resources: null,
    __packages: null,
    __parts: null,
    
    setEnvironmentValue(key, value) {
      let env = this.getEnvironment();
      if (value === undefined) {
        delete env[key];
      } else {
        env[key] = value;
      }
    },
    
    getEnvironmentValue(key, defaultValue) {
      let env = this.getEnvironment();
      let value = env[key];
      if (value === undefined) {
        if (defaultValue !== undefined) {
          env[key] = defaultValue;
        }
        value = defaultValue;
      }
      return value;
    },
    
    getApplication() {
      return this.__application;
    },
    
    getTarget() {
      return this.__target;
    },
    
    getApplicationRoot() {
      return this.__target.getApplicationRoot(this.__application);
    },
    
    getAnalyser() {
      return this.__application.getAnalyser();
    },
    
    /**
     * Syncs all assets into the output directory
     */
    async syncAssets() {
      for (let i = 0; i < this.__packages.length; i++) {
        let pkg = this.__packages[i];
        await qx.tool.utils.Promisify.poolEachOf(pkg.getAssets(), 10, asset => asset.sync(this.__target));
      }
    },

    addLibrary(library) {
      this.__libraries.push(library);
    },
    
    getAppLibrary() {
      let appLibrary = this.__application.getAnalyser().getLibraryFromClassname(this.__application.getClassName());
      return appLibrary;
    },
    
    getLibraries() {
      return this.__libraries;
    },
    
    addExternal(type, uri) {
      this.__preload[type].push("__external__:" + uri);
    },
    
    addPreload(type, library, filename) {
      this.__preload[type].push(library.getNamespace() + ":" + filename);
    },
    
    getPreloads() {
      return this.__preload;
    },
    
    addPreBootCode(code) {
      this.__preBootCode.push(code);
    },
    
    getPreBootCode() {
      return this.__preBootCode.join("\n");
    },
    
    addPart(part) {
      this.__parts.push(part);
    },
    
    getParts() {
      return this.__parts;
    },
    
    setParts(parts) {
      this.__parts = parts;
    },
    
    addPackage(pkg) {
      this.__packages.push(pkg);
    },
    
    getPackages() {
      return Object.values(this.__packages);
    },
    
    addResource(key, path) {
      this.__resources[key] = path;
    }
  }
});
