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
require("./AbstractAppMaker");
var util = require("../util");
const mkParentPath = util.promisify(util.mkParentPath);
var log = util.createLog("analyser");

/**
 * Application maker; supports multiple applications to compile against a single
 * target
 */
qx.Class.define("qx.tool.compiler.makers.AppMaker", {
  extend: qx.tool.compiler.makers.AbstractAppMaker,

  /**
   * Constructor
   * @param className {String|String[]} classname(s) to generate
   * @param theme {String} the theme classname
   */
  construct: function(className, theme) {
    this.base(arguments);
    this.__applications = [];
    if (className) {
      var app = new qx.tool.compiler.app.Application(className);
      if (theme) {
        app.setTheme(theme);
      }
      this.addApplication(app);
    }
  },

  members: {
    __applications: null,

    /**
     * Adds an Application to be made
     * @param app
     */
    addApplication: function(app) {
      this.__applications.push(app);
    },

    /**
     * Returns the array of applications
     * @returns {Application[]}
     */
    getApplications: function() {
      return this.__applications;
    },

    /*
     * @Override
     */
    make: function() {
      var analyser = this.getAnalyser();
      
      this.fireEvent("making");
      this.setSuccess(null);
      this.setHasWarnings(null);
      let success = true;
      let hasWarnings = false;

      // merge all environment settings for the analyser
      const compileEnv = qx.tool.utils.Values.merge({},
        qx.tool.compiler.ClassFile.ENVIRONMENT_CONSTANTS,
        {
          "qx.compilerVersion": qx.tool.compiler.Version.VERSION
        },
        this.getEnvironment(),
        this.getTarget().getDefaultEnvironment(),
        this.getTarget().getEnvironment());

      let appEnvironments = {};
      this.getApplications().forEach(app => {
        appEnvironments[app.toHashCode()] = qx.tool.utils.Values.merge({}, compileEnv, app.getCalculatedEnvironment());
      });
      
      // Analyze the list of environment variables, detect which are shared between all apps
      let allAppEnv = {};
      this.getApplications().forEach(app => {
        let env = appEnvironments[app.toHashCode()];
        Object.keys(env).forEach(key => {
          if (!allAppEnv[key]) {
            allAppEnv[key] = {
              value: env[key],
              same: true
            };
          } else if (allAppEnv[key].value !== env[key]) {
            allAppEnv[key].same = false;
          }
        });
      });
      
      // If an env setting is the same for all apps, move it to the target for code elimination; similarly,
      //  if it varies between apps, then remove it from the target and make each app specify it individually
      this.getApplications().forEach(app => {
        let env = appEnvironments[app.toHashCode()];
        Object.keys(allAppEnv).forEach(key => {
          if (allAppEnv[key].same) {
            delete env[key];
          } else if (env[key] === undefined) {
            env[key] = compileEnv[key];
          }
        });
      });
      
      // Cleanup to remove env that have been moved to the app 
      Object.keys(allAppEnv).forEach(key => {
        if (allAppEnv[key].same) {
          compileEnv[key] = allAppEnv[key].value;
        } else {
          delete compileEnv[key];
        }
      });

      return analyser.open()
        .then(() => {
          analyser.setEnvironment(compileEnv);
          if (!this.isNoErase() && analyser.isContextChanged()) {
            log.log("enviroment changed - delete output dir");
            return this.eraseOutputDir()
              .then(() => mkParentPath(this.getOutputDir()))
              .then(() => analyser.resetDatabase());
          }
          return Promise.resolve();
        })
        .then(() => util.promisifyThis(analyser.initialScan, analyser))
        .then(() => analyser.updateEnvironmentData())
        .then(() => {
          this.getTarget().setAnalyser(analyser);
          this.__applications.forEach(app => app.setAnalyser(analyser));
          return this.getTarget().open();
        })
        .then(() => {
          if (this.isOutputTypescript()) {
            analyser.getLibraries().forEach(library => {
              var symbols = library.getKnownSymbols();
              for (var name in symbols) {
                var type = symbols[name];
                if (type === "class" && name !== "q" && name !== "qxWeb") {
                  analyser.addClass(name);
                }
              }
            });
          }

          this.__applications.forEach(function(app) {
            app.getRequiredClasses().forEach(function(className) {
              analyser.addClass(className);
            });
            if (app.getTheme()) {
              analyser.addClass(app.getTheme());
            }
          });
          return qx.tool.utils.Promisify.call(cb => analyser.analyseClasses(cb));
        })
        .then(() => analyser.saveDatabase())
        .then(() => {
          var target = this.getTarget();
          this.fireEvent("writingApplications");

          // Detect which applications need to be recompiled by looking for classes recently compiled
          //  which is on the application's dependency list.  The first time `.make()` is called there
          //  will be no dependencies so we just compile anyway, but `qx compile --watch` will call it
          //  multiple times
          let compiledClasses = this.getRecentlyCompiledClasses(true);
          var appsThisTime = this.__applications.filter(app => {
            let loadDeps = app.getDependencies();
            if (!loadDeps || !loadDeps.length) {
              return true; 
            }
            return loadDeps.some(name => Boolean(compiledClasses[name]));
          });

          let db = analyser.getDatabase();
          var promises = appsThisTime.map(application => {
            if (application.getType() != "browser" && !compileEnv["qx.headless"]) {
              qx.tool.compiler.Console.print("qx.tool.compiler.maker.appNotHeadless", application.getName());
            }
            var appEnv = qx.tool.utils.Values.merge({}, compileEnv, appEnvironments[application.toHashCode()]);
            application.calcDependencies();
            if (application.getFatalCompileErrors()) {
              qx.tool.compiler.Console.print("qx.tool.compiler.maker.appFatalError", application.getName());
              success = false;
              return undefined;
            }
            if (!hasWarnings) {
              application.getDependencies().forEach(classname => {
                if (!db.classInfo[classname] || !db.classInfo[classname].markers) {
                  return;
                }
                db.classInfo[classname].markers.forEach(marker => {
                  let type = qx.tool.compiler.Console.getInstance().getMessageType(marker.msgId);
                  if (type == "warning") {
                    hasWarnings = true;
                  }
                });
              });
            }

            this.fireDataEvent("writingApplication", application);
            return target.generateApplication(application, appEnv)
              .then(() => this.fireDataEvent("writtenApplication", application));
          });

          return qx.Promise.all(promises)
            .then(() => {
              this.fireEvent("writtenApplications");
              if (this.isOutputTypescript()) {
                return new qx.tool.compiler.targets.TypeScriptWriter(target)
                  .set({ outputTo: this.getOutputTypescriptTo() })
                  .run();
              }
              return undefined;
            });
        })
        .then(() => analyser.saveDatabase())
        .then(() => {
          this.fireEvent("made");
          this.setSuccess(success);
          this.setHasWarnings(hasWarnings);
        });
    }
  }
});
