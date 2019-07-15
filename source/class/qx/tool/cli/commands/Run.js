/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2019 Zenesis Ltd

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * John Spackman (john.spackman@zenesis.com, @johnspackman)

************************************************************************ */

const path = require("upath");
const process = require("process");
const psTree = require("ps-tree");

require("./Compile");

/**
 * Runs a server application
 */
qx.Class.define("qx.tool.cli.commands.Run", {
  extend: qx.tool.cli.commands.Compile,

  statics: {

    YARGS_BUILDER: {
    },

    getYargsCommand: function() {
      return {
        command   : "run [configFile]",
        describe  : "runs a server application (written in node) with continuous compilation, using compile.json",
        builder   : Object.assign(qx.tool.cli.commands.Compile.YARGS_BUILDER, qx.tool.cli.commands.Run.YARGS_BUILDER),
        handler: function(argv) {
          return new qx.tool.cli.commands.Run(argv)
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
      let config = this._getConfig();
      if (!config.run) {
        qx.tool.compiler.Console.print("qx.tool.cli.run.noRunConfig");
        process.exit(-1);
      }
      
      if (!config.run.application) {
        qx.tool.compiler.Console.print("qx.tool.cli.run.noAppName");
        process.exit(-1);
      }
      
      let maker = this.getMaker();
      let target = maker.getTarget();
      let apps = maker.getApplications().filter(app => app.getName() == config.run.application);
      if (apps.length != 1) {
        qx.tool.compiler.Console.print("qx.tool.cli.run.noAppName");
        process.exit(-1);
      }
      
      let app = apps[0];
      if (app.getType() != "node") {
        qx.tool.compiler.Console.print("qx.tool.cli.run.mustBeNode");
        process.exit(-1);
      }
      
      function kill(parentId) {
        return new qx.Promise((resolve, reject) => {
          psTree(parentId, function (err, children) {
            if (err) { 
              reject(err);
              return;
            }
            children.forEach(item => {
              try {
                process.kill(item.PID);
              } catch (ex) {
                // Nothing
              }
            });
            try {
              process.kill(parentId);
            } catch (ex) {
              // Nothing
            }
            resolve();
          });
        });
      }
      
      let scriptname = path.join(target.getApplicationRoot(app), app.getName() + ".js");
      let args = config.run.arguments||"";
      let cmd = `node ${scriptname} ${args}`;
      /* eslint-disable @qooxdoo/qx/no-illegal-private-usage */
      this.addListener("made", async e => {
        if (this.__process) {
          try {
            await kill(this.__process.pid);
          } catch (ex) {
            //Nothing
          }
          this.__process = null;
        }
        console.log("Starting application: " + cmd);
        let child = this.__process = require("child_process").exec(cmd);
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", function(data) {
          console.log(data);
        });

        child.stderr.setEncoding("utf8");
        child.stderr.on("data", function(data) {
          console.error(data);
        });

        child.on("close", function(code) {
          console.log("Application has terminated");
        });        
        child.on("error", function(err) {
          console.error("Application has failed: " + err);
        });        
      });
    }
  },

  defer: function(statics) {
    qx.tool.compiler.Console.addMessageIds({
      "qx.tool.cli.run.noRunConfig": "Cannot run anything because the config.json does not have a `run` configuration",
      "qx.tool.cli.run.noAppName": "Cannot run anything because the config.json does not specify a unique application name",
      "qx.tool.cli.run.mustBeNode": "The application %1 is not a node application (only node applications are supported)"
    }, "error");
  }
});

