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

const fs = require("fs");
const path = require("path");
const process = require("process");

/**
 * Compiles the project, serves it up as a web page (default, can be turned off),
 * and dispatches the "runTests" event. All tests that should be run need to
 * register themselfs by the test command. 
 * 
 * The runTests event is called with a {@link qx.even.type.Data}
 * containing the command instance.
 *
 * A test can write to the (native) `errorCode` property of this instance,
 * which is used to determine the exit code of the `qx test` command.
 * This means, however, that the last run test overwrites the
 * `errorCode` of any previous test, and has to take care of this.
 *
 */
qx.Class.define("qx.tool.cli.commands.Test", {
  extend: qx.tool.cli.commands.Serve,

  statics: {

    /**
     * The name of the file containing the compile config for the testrunner
     * defaults to "compile-test.json"
     */
    CONFIG_FILENAME : "compile-test.json",

    YARGS_BUILDER: {
      "fail-fast": {
        describe: "Exit on first failing test",
        defaut: true,
        type: "boolean"
      }
    },

    getYargsCommand: function() {
      return {
        command   : "test",
        describe  : "run test for current project",
        builder   : (() => {
          let res = Object.assign({},
            qx.tool.cli.commands.Compile.YARGS_BUILDER,
            qx.tool.cli.commands.Serve.YARGS_BUILDER,
            qx.tool.cli.commands.Test.YARGS_BUILDER
          );
          delete res.watch;
          delete res["machine-readable"];
          delete res["feedback"];
          delete res["show-startpage"];
          delete res["rebuild-startpage"];
          return res;
        })()
      };
    }
  },

  events: {
    /**
     * Fired to start tests.
     * Event data is this command instance
     */
    "runTests": "qx.event.type.Data"
  },
  construct(argv) {
    this.base(arguments, argv);
    this.__tests = [];
  },

  members: {

    /**
     * The error code of the last run test
     * @var {Number}
     */
    errorCode: 0,

    /**
     * @var {Array}
     */
    __tests: null,

    /**
     * add a test object and listens for the change of exitCode property
     * @param {qx.tool.cli.api.Test} test
     */
    addTest: function(test) {
      qx.core.Assert.assertInstance(test, qx.tool.cli.api.Test);
      test.addListenerOnce("changeExitCode", evt => {
        let exitCode = evt.getData();
        // overwrite error code only in case of errors
        if (exitCode) {
          this.errorCode = exitCode;
        }
        // handle result and inform user
        if (exitCode === 0) {
          if (test.getName() && !this.argv.quiet) {
            qx.tool.compiler.Console.info(`Test '${test.getName()}' passed.`);
          }
        } else {
          if (test.getName()) {
            qx.tool.compiler.Console.error(`Test '${test.getName()}' failed with exit code ${exitCode}.`);
          }
          if (this.argv.failFast) {
            process.exit(exitCode);
          }
        }
      });
      this.__tests.push(test);
      return test;
    },

    /**
     * @Override
     */
    process: async function() {
      this.argv.watch = false;
      this.argv["machine-readable"] = false;
      this.argv["feedback"] = false;
      this.argv["show-startpage"] = false;
      // check for special test compiler config
      if (!this.argv.configFile && fs.existsSync(path.join(process.cwd(), qx.tool.cli.commands.Test.CONFIG_FILENAME))) {
        this.argv.configFile = qx.tool.cli.commands.Test.CONFIG_FILENAME;
      }
      this.addListener("making", () => {
        if (!this.hasListener("runTests") && (this.__tests.length === 0)) {
          qx.tool.compiler.Console.error(
            `No tests are registered!
               Please register a testrunner, e.g. testtapper with:
               qx contrib install @qooxdoo/qxl.testtapper
               See documentation https://qooxdoo.org/docs/#/development/testing/
              `
          );
          process.exit(-1);
        }
      });

      this.addListener("afterStart", () => {
        let res = this.__tests.map(test => test.execute());
        res.push(this.fireDataEventAsync("runTests", this));
        qx.Promise.all(res).then(() => {
          process.exit(this.errorCode);
        });
      });
      
      if (this.__needsServer()) {
        // start server
        await this.base(arguments);
      } else {
        // compile only
        await qx.tool.cli.commands.Compile.prototype.process.call(this);
        // since the server is not started, manually fire the event necessary for firing the "runTests" event
        this.fireEvent("afterStart");
      }
    },

    __needsServer: function() {
      return this.__tests.some(test => test.getNeedsServer());
    }
  }
});

