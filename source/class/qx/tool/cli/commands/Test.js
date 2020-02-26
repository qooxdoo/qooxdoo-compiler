/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2020 Henner Kollmann

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project"s top-level directory for details.


************************************************************************ */
require("./Serve");

/**
 * Compiles the project and serves it up as a web page
 */
qx.Class.define("qx.tool.cli.commands.Test", {
  extend: qx.tool.cli.commands.Serve,

  statics: {

    YARGS_BUILDER: {
      verbose: {
        describe: "Verbose logging",
        alias: "v",
        type: "boolean"
      },
      diag: {
        describe: "show diagnostic output",
        type: "boolean"
      },
      terse: {
        describe: "show only summary and errors",
        type: "boolean"
      },
      class: {
        describe: "only run tests of this class",
        type: "string"
      },
      method: {
        describe: "only run tests of this method",
        type: "string"
      }
    },

    getYargsCommand: function() {
      return {
        command   : "test [configFile]",
        describe  : "run test for current project",
        builder   : Object.assign(qx.tool.cli.commands.Compile.YARGS_BUILDER, qx.tool.cli.commands.Serve.YARGS_BUILDER, qx.tool.cli.commands.Test.YARGS_BUILDER),
        handler: function(argv) {
          return new qx.tool.cli.commands.Test(argv)
            .process()
            .catch(e => {
              qx.tool.compiler.Console.error(e.stack || e.message);
              process.exit(1);
            });
        }
      };
    }
  },

  events: {
    /**
     * Fired to start tests
    */
    "runTests": "qx.event.type.Data"
  },

  members: {
    /*
     * @Override
     */
    process: async function() {
      this.argv.watch = false;
      this.argv["machine-readable"] = false;
      this.argv["feedback"] = false;
      this.addListener("making", () => {
        if (!this.hasListener("runTests")) {
          qx.tool.compiler.Console.error(
            `No test runner registered!
               Please register a testrunner, e.g. testtapper with:
               qx contrib install @qooxdoo/qxl.testtapper
              `
          );
          process.exit(-1);
        }
      });
      this.addListener("afterStart", () => {
        let result = {errorCode: 0};
        let res = this.fireDataEvent("runTests", result);
        res.then(() => {
          process.exit(result.errorCode);          
        });
      });
      await this.base(arguments);
    }
  },


  defer: function(statics) {
    qx.tool.compiler.Console.addMessageIds({
      "qx.tool.cli.test.noAppName": "Cannot run anything because the config.json does not specify a unique application name",
      "qx.tool.cli.test.tooManyMakers": "Cannot run anything because multiple targets are detected",
      "qx.tool.cli.test.tooManyApplications": "Cannot run anything because multiple applications are detected"
    });
  }
});

