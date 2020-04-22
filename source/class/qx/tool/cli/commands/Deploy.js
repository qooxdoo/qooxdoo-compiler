/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2020 Zenesis Ltd https://www.zenesis.com

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * John Spackman (john.spackman@zenesis.com, @johnspackman)

************************************************************************ */
require("./Compile");

require("@qooxdoo/framework");
const fs = require("fs");
const path = require("upath");

/**
 * Build and deploy a project
 * 
 */
qx.Class.define("qx.tool.cli.commands.Deploy", {
  extend: qx.tool.cli.commands.Command,
  statics: {
    getYargsCommand: function() {
      return {
        command: "deploy [options]",
        describe: "deploys qooxdoo application(s)",
        builder: {
          "out": {
            describe: "Output directory for the deployment",
            demandOption: true,
            alias: "o"
          },
          "app-name": {
            describe: "The name of the application to deploy (default is all apps), can be comma separated list",
            nargs: 1,
            type: "string"
          },
          "source-maps": {
            describe: "Enable source maps",
            type: "boolean",
            default: null,
            alias: "m"
          },
          "clean": {
            describe: "Deletes the application output directory before deploying",
            type: "boolean",
            default: false,
            alias: "D"
          }
        }
      };
    }
  },

  members: {

    /*
     * @Override
     */
    process: async function() {
      let argv = this.argv;
      
      let config = this.__config = await qx.tool.cli.Cli.getInstance().getParsedArgs();
      if (!config) {
        throw new qx.tool.utils.Utils.UserError("Error: Cannot find any configuration");
      }
      
      if (argv.sourceMaps === null) {
        qx.tool.compiler.Console.print("qx.tool.cli.deploy.sourceMapsNotSpecified");
      }
      
      if (!argv.clean) {
        qx.tool.compiler.Console.print("qx.tool.cli.deploy.notClean");
      }
      
      config.targetType = "build";
      let compileArgv = {
        target: config.targetType,
        writeLibraryInfo: false,
        download: false,
        updatePoFiles: false,
        saveUnminified: false,
        bundling: true,
        minify: "mangle",
        __deploying: true
      };
      let appNames = null;
      if (argv.appName) {
        compileArgv.appName = argv.appName;
        appNames = {};
        argv.appName.split(",").forEach(appName => appNames[appName] = true);
      }
      if (argv.clean) {
        compileArgv.clean = true;
      }
      let cmd = new qx.tool.cli.commands.Compile(compileArgv);
      await cmd.process();
      
      await qx.tool.utils.Promisify.eachOfSeries(cmd.getMakers(), async (maker, makerIndex) => {
        let target = maker.getTarget();
        
        await qx.tool.utils.Promisify.eachOfSeries(maker.getApplications(), async app => {
          if (appNames && !appNames[app.getName()]) {
            return;
          }
          
          let deployDir = path.join(argv.out, app.getName());
          if (argv.clean) {
            await qx.tool.utils.files.Utils.deleteRecursive(deployDir);
          }
          
          await qx.tool.utils.Utils.makeDirs(deployDir);
          let appRoot = target.getApplicationRoot(app);
          
          let files = await fs.readdirAsync(appRoot);
          await qx.tool.utils.Promisify.eachOf(files, async file => {
            let stat = await fs.statAsync(path.join(appRoot, file));
            if (!stat.isFile()) {
              return;
            }
            let ext = path.extname(file);
            if (ext == ".map" && !argv.sourceMaps) {
              return;
            }
            let from = path.join(appRoot, file);
            let to = path.join(deployDir, file);
            if (ext == ".js" && !argv.sourceMaps) {
              let rs = fs.createReadStream(from, { encoding: "utf8", emitClose: true });
              let ws = fs.createWriteStream(to, { encoding: "utf8", emitClose: true });
              let ss = new qx.tool.utils.Utils.StripSourceMapTransform();
              await new qx.Promise((resolve, reject) => {
                rs.on("error", reject);
                ws.on("error", reject);
                ws.on("finish", resolve);
                rs.pipe(ss);
                ss.pipe(ws);
              });
            } else {
              await qx.tool.utils.files.Utils.copyFile(from, to);
            }
          });
        });
        let from = path.join(target.getOutputDir(), "resource");
        let to = path.join(argv.out, "resource");
        if (makerIndex == 0 && argv.clean) {
          await qx.tool.utils.files.Utils.deleteRecursive(to);
        }
        await qx.tool.utils.files.Utils.sync(from, to);
      });
    }
  },

  defer: function(statics) {
    qx.tool.compiler.Console.addMessageIds({
    }, "error");
    qx.tool.compiler.Console.addMessageIds({
      "qx.tool.cli.deploy.sourceMapsNotSpecified": "Source maps are not being deployed, see --source-maps command line option",
      "qx.tool.cli.deploy.notClean": "Incremental compilation - this is faster but may preserve old artifacts, it is recommended to use --clean command line option"
    }, "warning");
  }
});
