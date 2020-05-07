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
    this.__partsLookup = {};
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
    
    addPreload(type, filename) {
      this.__preload[type].push(filename);
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
    
    /**
     * Creates a new Part and adds it
     * 
     * @param name {String} identifier
     * @return {Part}
     */
    createPart(name) {
      let part = new qx.tool.compiler.targets.meta.Part(this.getTarget(), name, this.__parts.length);
      this.__parts.push(part);
      this.__partsLookup[name] = part;
      return part;
    },
    
    /**
     * Returns a list of all parts
     * 
     * @return {Part[]}
     */
    getParts() {
      return this.__parts;
    },
    
    /**
     * Returns a part with a given name
     * 
     * @param name {String} the name to look for
     */
    getPart(name) {
      return this.__partsLookup[name]||null;
    },
    
    /**
     * Returns a list of all packages
     * 
     * @return {Package[]}
     */
    getPackages() {
      return Object.values(this.__packages);
    },
    
    /**
     * Creates a package and adds it
     * 
     * @return {Package}
     */
    createPackage() {
      let pkg = new qx.tool.compiler.targets.meta.Package(this, this.__packages.length);
      this.__packages.push(pkg);
      return pkg;
    },
    
    /**
     * Gets a package for specific locale, creating a part with the name set to the localeId
     * if there isn't one already.  Used for when i18nAsParts == true
     * 
     * @param localeId {String} the locale to look for
     * @return {Package}
     */
    getLocalePackage(localeId) {
      let part = this.getPart(localeId);
      if (!part) {
        part = this.createPart(localeId);
        part.addPackage(this.createPackage());
      }
      let pkg = part.getDefaultPackage();
      return pkg;
    },
    
    /**
     * Adds a resource
     * 
     * @param key {String} the resource identifier
     * @param path {String} the path to the resource
     */
    addResource(key, path) {
      this.__resources[key] = path;
    },
    
    /**
     * Returns all of the resources
     * 
     * @return {Map}
     */
    getResources() {
      return this.__resources;
    }
  }
});
