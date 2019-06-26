/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2017 Zenesis Ltd

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * John Spackman (john.spackman@zenesis.com, @johnspackman)
     * Henner Kollmann(Henner.Kollmann@gmx.de, @hkollmann)

************************************************************************ */


require("@qooxdoo/framework");
require("../../config");
const path = require("upath");
const fs = qx.tool.utils.Promisify.fs;
const semver = require("semver");


/**
 * Mixin used for commands that need to be able to parse compiler configuration
 * 
 * Configuration files do not support processes, job executions, or even
 * macros - if you want to add basic processing (eg for macros), use a .js file to
 * manipulate the data.  If you want to customise the Maker that is produced, you
 * need to use the API directly.
 *
 */
qx.Mixin.define("qx.tool.cli.commands.MConfig", {
  
  statics: {
    compileJsFilename: "compile.js"
  },

  members: {
    
    _compilerApi: null,

    /**
     * Parses the command line and produces configuration data.
     * 
     * Loads a configuration file from a .js or .json file; if you provide a .js
     * file the file must be a module which returns an object whcih has any of
     * these properties:
     * 
     *  CompilerConfig - the class (derived from qx.tool.cli.api.CompilerApi)
     *    for configuring the compiler
     *    
     * Each library can also have a compile.js, and that is also a module which can
     * return an object with any of these properties:
     *  
     *  LibraryConfig - the class (derived from qx.tool.cli.api.LibraryApi)
     *    for configuring the library 
     *
     */
    parse: async function() {
      var parsedArgs = await this.__parseImpl();
      var lockfile_content = {
        version: qx.tool.config.Lockfile.getInstance().getVersion()
      };

      let compileJsFilename = qx.tool.cli.commands.MConfig.compileJsFilename;
      let compileJsonFilename = qx.tool.config.Compile.config.fileName;
      if (parsedArgs.config) {
        if (parsedArgs.config.match(/\.js$/)) {
          compileJsFilename = parsedArgs.config;
        } else {
          compileJsonFilename = parsedArgs.config;
        }
      }
      
      let CompilerApi = qx.tool.cli.api.CompilerApi;
      if (await fs.existsAsync(compileJsFilename)) {
        let compileJs = await this.__loadJs(compileJsFilename);
        if (compileJs.CompilerApi) {
          CompilerApi = compileJs.CompilerApi;
        }
      }
      let compilerApi = this._compilerApi = new CompilerApi(this).set({ 
        rootDir: ".",
        configFilename: compileJsonFilename
      });
      
      await compilerApi.load();
      let config = compilerApi.getConfiguration();
      
      if (parsedArgs.config) {
        let lockfile = qx.tool.config.Lockfile.config.fileName;
        try {
          var name = path.join(path.dirname(parsedArgs.config), lockfile);
          lockfile_content = await qx.tool.utils.Json.loadJsonAsync(name) || lockfile_content;
        } catch (ex) {
          // Nothing
        }
        // check semver-type compatibility (i.e. compatible as long as major version stays the same)
        let schemaVersion = semver.coerce(qx.tool.config.Lockfile.getInstance().getVersion(), true).raw;
        let fileVersion = lockfile_content && lockfile_content.version ? semver.coerce(lockfile_content.version, true).raw : "1.0.0";
        if (semver.major(schemaVersion) > semver.major(fileVersion)) {
          if (this.argv.force) {
            let config = {
              verbose: this.argv.verbose,
              quiet: this.argv.quiet,
              save: false
            };
            const installer = new qx.tool.cli.commands.package.Install(config);
            let filepath = installer.getLockfilePath();
            let backup = filepath + ".old";
            await fs.copyFileAsync(filepath, backup);
            if (!this.argv.quiet) {
              qx.tool.compiler.Console.warn(`*** A backup of ${lockfile} has been saved to ${backup}, in case you need to revert to it. ***`);
            }
            await installer.deleteLockfile();
            for (let lib of lockfile_content.libraries) {
              if (!await installer.isInstalled(lib.uri, lib.repo_tag)) {
                if (lib.repo_tag) {
                  await installer.install(lib.uri, lib.repo_tag);
                } else if (lib.path && fs.existsSync(lib.path)) {
                  await installer.installFromLocaPath(lib.path, lib.uri);
                }
              } else if (this.argv.verbose) {
                qx.tool.compiler.Console.info(`>>> ${lib.uri}@${lib.repo_tag} is already installed.`);
              }
            }
            lockfile_content = await installer.getLockfileData();
          } else {
            throw new qx.tool.utils.Utils.UserError(
              `*** Warning ***\n` +
              `The schema of '${lockfile}' has changed. Execute 'qx clean && qx compile --force' to delete and regenerate it.\n` +
              `You might have to re-apply manual modifications to '${lockfile}'.`
            );
          }
        }
      }
      this._mergeArguments(parsedArgs, config, lockfile_content);

      if (config.libraries) {
        for (const aPath of config.libraries) {
          let libCompileJsFilename = path.join(aPath, qx.tool.cli.commands.MConfig.compileJsFilename);
          let LibraryApi = qx.tool.cli.api.LibraryApi;
          if (await fs.existsAsync(libCompileJsFilename)) {
            let compileJs = await this.__loadJs(libCompileJsFilename);
            if (compileJs.LibraryApi) {
              LibraryApi = compileJs.LibraryApi;
            }
          }
          
          let libraryApi = new LibraryApi().set({ 
            rootDir: aPath,
            compilerApi: compilerApi
          });
          compilerApi.addLibraryApi(libraryApi);
          await libraryApi.load();
        }
      }
      
      await compilerApi.afterLibrariesLoaded();
      
      return compilerApi.getConfiguration();
    },

    /*
     * Merges the argv into the config data
     *
     */
    _mergeArguments: function(parsedArgs, config, lockfileContent) {
      if (parsedArgs.config) {
        var defaultTarget = parsedArgs.target||config.defaultTarget;
        if (defaultTarget) {
          for (var i = 0; i < config.targets.length; i++) {
            if (config.targets[i].type === defaultTarget) {
              config.target = config.targets[i];
              break;
            }
          }
        }
        if (!config.target) {
          if (config.targets && (config.targets.length > 0)) {
            config.target = config.targets[0];
          }
        }
      } else {
        var target = config.target = {};
        if (parsedArgs.target) {
          target.type = parsedArgs.target;
        }
        if (parsedArgs.outputPath) {
          target.outputPath = parsedArgs.outputPath;
        }
      }

      if (!config.locales) {
        config.locales = [];
      }
      if (parsedArgs.locales) {
        parsedArgs.locales.forEach(function(locale) {
          if (config.locales.indexOf(locale) < 0) {
            config.locales.push(locale);
          }
        });
      }
      if (typeof parsedArgs.writeAllTranslations == "boolean") {
        config.writeAllTranslations = parsedArgs.writeAllTranslations;
      }

      if (parsedArgs.environment) {
        if (!config.environment) {
          config.environment = {};
        }
        /* eslint-disable guard-for-in */
        for (var key in parsedArgs.environment) {
          config.environment[key] = parsedArgs.environment[key];
        }
        /* eslint-enable guard-for-in */
      }

      if (!config.applications) {
        config.applications = [];
      }
      parsedArgs.applications.forEach(function(app) {
        if (!app.appClass) {
          throw new Error("Missing --app-class <classname> argument");
        }
        var configApp = {
          class: app.appClass
        };
        if (app.theme) {
          configApp.theme = app.theme;
        }
        if (app.name) {
          configApp.name = app.name;
        }
        config.applications.push(configApp);
      });

      if (parsedArgs.libraries) {
        if (!config.libraries) {
          config.libraries = [];
        }
        parsedArgs.libraries.forEach(function(aPath) {
          config.libraries.push(aPath);
        });
      }

      // Add default library for this project
      if (!config.libraries.length) {
        config.libraries.push(".");
      }

      if (lockfileContent.libraries) {
        config.packages = {};
        lockfileContent.libraries.forEach(function(library) {
          config.libraries.push(library.path);
          config.packages[library.uri] = library.path;
        });
      }

      if (!config.serve) {
        config.serve = {};
      }
      if (this.isExplicitArg("listen-port")) {
        config.serve.listenPort = this.argv.listenPort;
      } else {
        config.serve.listenPort = config.serve.listenPort || this.argv.listenPort;
      }
    },

    /**
     * Parses the command line, and produces a normalised configuration;
     *
     * @return {Object}
     */
    __parseImpl: async function() {
      let apps = [];
      let argv = this.argv;
      let result = {
        target: argv.target,
        outputPath: argv.outputPath||null,
        locales: null,
        writeAllTranslations: argv.writeAllTranslations,
        environment: {},
        applications: apps,
        libraries: argv.library||[],
        config: argv.configFile||qx.tool.config.Compile.config.fileName,
        continuous: argv.continuous,
        verbose: argv.verbose
      };
      if (argv.set) {
        argv.set.forEach(function(kv) {
          var m = kv.match(/^([^=\s]+)(=(.+))?$/);
          if (m) {
            var key = m[1];
            var value = m[3];
            try {
              result.environment[key] = Function("\"use strict\";return (" + value + ")")();
            } catch (error) {
              throw new Error("Failed to translate environment value '"+value+"' to a js datatype - "+error);
            }
          } else {
            throw new Error("Failed to parse environment setting commandline option '"+kv+"'");
          }
        });
      }

      if (argv.locale && argv.locale.length) {
        result.locales = argv.locale;
      }
      return result;
    },

    __loadJs: async function(aPath) {
      try {
        let module = require(path.resolve(aPath));
        return module;
      } catch (e) {
        let lines = e.stack.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(/^\s+at/)) {
            lines.splice(i); 
          }
        }
        let lineNumber = lines[0].split("evalmachine.<anonymous>:")[1];
        if (lineNumber !== undefined) {
          lines.shift();
          throw new Error("Error while reading " + aPath + " at line " + lineNumber + "\n" + lines.join("\n"));
        } else {
          throw new Error("Error while reading " + aPath + "\n" + lines.join("\n"));
        }
      }
    }
  }

});
