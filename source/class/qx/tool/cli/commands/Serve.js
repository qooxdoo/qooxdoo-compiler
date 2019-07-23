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

************************************************************************ */

const path = require("upath");
const process = require("process");
const express = require("express");
const http = require("http");
const fs = qx.tool.utils.Promisify.fs;

require("app-module-path").addPath(process.cwd() + "/node_modules");

require("./Compile");

/**
 * Handles compilation of the project by qxcompiler
 */
qx.Class.define("qx.tool.cli.commands.Serve", {
  extend: qx.tool.cli.commands.Compile,

  statics: {

    YARGS_BUILDER: {
      "listen-port": {
        alias: "p",
        describe: "The port for the web browser to listen on",
        type: "number",
        default: 8080
      },
      "show-startpage": {
        alias: "S",
        describe: "Show the startpage with the list of applications and additional information",
        type: "boolean",
        default: false
      },
      "rebuild-startpage": {
        alias: "R",
        describe: "Rebuild the startpage with the list of applications and additional information",
        type: "boolean",
        default: false
      }
    },

    getYargsCommand: function() {
      return {
        command   : "serve [configFile]",
        describe  : "runs a webserver to run the current application with continuous compilation, using compile.json",
        builder   : Object.assign(qx.tool.cli.commands.Compile.YARGS_BUILDER, qx.tool.cli.commands.Serve.YARGS_BUILDER),
        handler: function(argv) {
          return new qx.tool.cli.commands.Serve(argv)
            .process()
            .catch(e => {
              qx.tool.compiler.Console.error(e.stack || e.message);
              process.exit(1);
            });
        }
      };
    }
  },

  members: {
    /*
     * @Override
     */
    process: async function() {
      this.argv.watch = true;
      this.argv["machine-readable"] = false;
      this.argv["feedback"] = false;
      await this.base(arguments);
      // build website if it hasn't been built yet.
      const website = new qx.tool.utils.Website();
      if (!await fs.existsAsync(website.getTargetDir()) || this.argv.rebuildStartpage) {
        qx.tool.compiler.Console.info(">>> Building startpage...");
        await website.generateSite();
        await website.compileScss();
      }
      await this.runWebServer();
    },


    /**
     *
     * @returns
     */
    /* @ignore qx.tool.$$resourceDir */

    runWebServer: async function() {
      let makers = this.getMakers().filter(maker => maker.getApplications().some(app => app.isBrowserApp()));
      let apps = [];
      makers.forEach(maker => { 
        maker.getApplications().forEach(app => {
          if (app.isBrowserApp()) {
            apps.push(app); 
          }
        });
      });
      var config = this._getConfig();

      const app = express();
      const website = new qx.tool.utils.Website();
      if (apps.length === 1 && apps[0].getWriteIndexHtmlToRoot() && this.argv.showStartpage === false) {
        let target = makers[0].getTarget();
        app.use("/", express.static(target.getOutputDir()));
      } else {
        let s = await this.getAppQxPath();
        if (!await fs.existsAsync(path.join(s, "docs"))) {
          s = path.dirname(s);        
        }   
        app.use("/docs", express.static(path.join(s, "docs")));
        app.use("/apps", express.static(path.join(s, "apps")));
        app.use("/", express.static(website.getTargetDir()));
        var appsData = [];
        makers.forEach(maker => {
          let target = maker.getTarget();
          app.use("/" + target.getOutputDir(), express.static(target.getOutputDir()));
          appsData.push({
            target: {
              type: target.getType(),
              outputDir: "/" + target.getOutputDir()
            },
            apps: maker.getApplications()
              .filter(app => app.isBrowserApp())
              .map(app => ({
                name: app.getName(),
                type: app.getType(),
                title: app.getTitle() || app.getName(),
                outputPath: target.getProjectDir(app) // no trailing slash or link will break
              }))
          });
        });
        app.get("/serve.api/apps.json", (req, res) => {
          res.set("Content-Type", "application/json");
          res.send(JSON.stringify(appsData, null, 2));
        });
      }
      this.addListenerOnce("made", e => {
        let server = http.createServer(app);
        server.on("error", e => {
          if (e.code === "EADDRINUSE") {
            qx.tool.compiler.Console.print("qx.tool.cli.serve.webAddrInUse", config.serve.listenPort);
            process.exit(-1);
          } else {
            qx.tool.compiler.Console.log("Error when starting web server: " + e);
          }
        });
        server.listen(config.serve.listenPort, () =>
          qx.tool.compiler.Console.print("qx.tool.cli.serve.webStarted", "http://localhost:" + config.serve.listenPort));
      });
    }
  },

  defer: function(statics) {
    qx.tool.compiler.Console.addMessageIds({
      "qx.tool.cli.serve.webStarted": "Web server started, please browse to %1",
      "qx.tool.cli.serve.webAddrInUse": "Web server cannot start because port %1 is already in use"
    });
  }
});

