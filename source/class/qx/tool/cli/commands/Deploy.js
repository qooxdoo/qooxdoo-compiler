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
const stream = require("stream");
const util = require("util");
const pipeline = util.promisify(stream.pipeline);

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
            demandOption: true
          },
          "app-name": {
            describe: "The name of the application to deploy (default is all apps)",
            nargs: 1,
            type: "string"
          },
          "source-maps": {
            describe: "Enable source maps",
            type: "boolean",
            default: null
          },
          "clean": {
            describe: "Deletes the application output directory before deploying",
            type: "boolean",
            default: false
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
      if (argv.appName) {
        compileArgv.appName = argv.appName;
      }
      if (argv.clean) {
        compileArgv.clean = true;
      }
      let cmd = new qx.tool.cli.commands.Compile(compileArgv);
      await cmd.process();
      
      await qx.tool.utils.Promisify.eachOfSeries(cmd.getMakers(), async (maker, makerIndex) => {
        let target = maker.getTarget();
        
        await qx.tool.utils.Promisify.eachOfSeries(maker.getApplications(), async app => {
          if (argv.appName && app.getName() != argv.appName) {
            return;
          }
          
          let deployDir = path.join(argv.out, app.getName());
          if (argv.clean) {
            await qx.tool.utils.files.Utils.deleteRecursive(deployDir);
          }
          
          await qx.tool.utils.Utils.makeDirs(deployDir);
          let appRoot = target.getApplicationRoot(app);
          
          let files = await fs.readdirAsync(appRoot, { withFileTypes: true });
          await qx.tool.utils.Promisify.eachOf(files, async file => {
            if (!file.isFile()) {
              return;
            }
            let ext = path.extname(file.name);
            if (ext == ".map" && !argv.sourceMaps) {
              return;
            }
            let from = path.join(appRoot, file.name);
            let to = path.join(deployDir, file.name);
            if (ext == ".js" && !argv.sourceMaps) {
              let rs = fs.createReadStream(from, "utf8");
              let ws = fs.createWriteStream(to, "utf8");
              await pipeline(rs, new qx.tool.utils.Utils.StripSourceMapTransform(), ws);
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
