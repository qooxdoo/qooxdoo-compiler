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
     * Henner Kollmann (Henner.Kollmann@gmx.de, @hkollmann)

************************************************************************ */
const fs = require("fs");
const path = require("upath");

/**
 * Build and deploy a project
 * 
 */
qx.Class.define("qx.tool.cli.commands.Deploy", {
  extend: qx.tool.cli.commands.Compile,
  statics: {
    YARGS_BUILDER: {
      "out": {
        describe: "Output directory for the deployment",
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
        default: false,
        alias: "m"
      },
      "target": {
        alias: "t",
        describe: "Set the target type. Default is build",
        type: "string",
        default: "build"
      }
    },

    getYargsCommand: function() {
      return {
        command: "deploy [options]",
        describe: "deploys qooxdoo application(s)",
        builder   : (() => {
          let res = Object.assign({}, 
            qx.tool.cli.commands.Compile.YARGS_BUILDER, 
            qx.tool.cli.commands.Deploy.YARGS_BUILDER
          );
          delete res.watch;
          delete res["write-library-info"];
          delete res.download;
          delete res["update-po-files"];
          delete res["save-unminified"];
          delete res.bundling;
          delete res.minify;
          return res;
        })()
      };
    }
  },

  members: {

    /*
     * @Override
     */
    process: async function() {
      let argv = this.argv;
      
      if (!argv.clean) {
        qx.tool.compiler.Console.print("qx.tool.cli.deploy.notClean");
      }
      
      let compileArgv = {
        writeLibraryInfo: false,
        download: false,
        updatePoFiles: false,
        saveUnminified: false,
        bundling: true,
        minify: "mangle",
        __deploying: true
      };
      qx.lang.Object.mergeWith(argv, compileArgv);
      await this.base(arguments);

      let appNames = null;
      if (argv.appName) {
        compileArgv.appName = argv.appName;
        appNames = {};
        argv.appName.split(",").forEach(appName => appNames[appName] = true);
      }
      
      if (argv.clean) {
        await qx.tool.utils.Promisify.eachOfSeries(this.getMakers(), async maker => {
          let target = maker.getTarget();
          
          await qx.tool.utils.Promisify.eachOfSeries(maker.getApplications(), async app => {
            if (appNames && !appNames[app.getName()]) {
              return;
            }
            let deployDir = argv.out || ((typeof target.getDeployDir == "function") && target.getDeployDir());
            if (deployDir) {
              await qx.tool.utils.files.Utils.deleteRecursive(deployDir);
            }
          });
        });
      }
      
      await qx.tool.utils.Promisify.eachOfSeries(this.getMakers(), async (maker, makerIndex) => {
        let target = maker.getTarget();
        
        await qx.tool.utils.Promisify.eachOfSeries(maker.getApplications(), async app => {
          if (appNames && !appNames[app.getName()]) {
            return;
          }
          let deployDir = argv.out || ((typeof target.getDeployDir == "function") && target.getDeployDir());
          if (!deployDir) {
            qx.tool.compiler.Console.print("qx.tool.cli.deploy.deployDirNotSpecified");
            return;
          }

          let sourceMaps = argv.sourceMaps || 
                         ((typeof target.getDeployMap == "function") && target.getDeployMap()) || 
                         ((typeof target.getSaveSourceInMap == "function") && target.getSaveSourceInMap());
          let appRoot = target.getApplicationRoot(app);
          let destRoot = path.join(deployDir, app.getName());
          await this.__copyFiles(appRoot, destRoot, sourceMaps);
          
          {
            let from = path.join(target.getOutputDir(), "resource");
            if (fs.existsSync(from)) {
              let to = path.join(deployDir, "resource");
              if (makerIndex == 0 && argv.clean) {
                await qx.tool.utils.files.Utils.deleteRecursive(to);
              }
              await qx.tool.utils.files.Utils.sync(from, to);
            }
          }
          {
            let from = path.join(target.getOutputDir(), "index.html");
            let to = path.join(deployDir, "index.html");
            if (fs.existsSync(from)) {
              fs.copyFileSync(from, to);
            }
          }
        });
      });
    },
    
    __copyFiles: async function(srcDir, destDir, sourceMaps) {
      await qx.tool.utils.Utils.makeDirs(destDir);
      let files = await fs.readdirAsync(srcDir);
      await qx.tool.utils.Promisify.eachOf(files, async file => {
        let from = path.join(srcDir, file);
        let to = path.join(destDir, file);

        let stat = await fs.statAsync(from);
        if (!stat.isFile()) {
          await this.__copyFiles(from, to, sourceMaps);
          return;
        }
        let ext = path.extname(file);
        if (ext == ".map" && !sourceMaps) {
          return;
        }
        
        
        if (ext == ".js" && !sourceMaps) {
          await qx.tool.utils.Utils.makeParentDir(to);
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
    }
  },

  defer: function(statics) {
    qx.tool.compiler.Console.addMessageIds({
      "qx.tool.cli.deploy.deployDirNotSpecified": "No deploy dir configured! Use --out parameter or deployPath target property in compile.json."
    }, "error");
    qx.tool.compiler.Console.addMessageIds({
      "qx.tool.cli.deploy.notClean": "Incremental compilation - this is faster but may preserve old artifacts, it is recommended to use --clean command line option"
    }, "warning");
  }
});
