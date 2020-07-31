const fs = require("fs");
const path = require("upath");
const process = require("process");

qx.Class.define("qx.compiler.CompilerApi", {
  extend: qx.tool.cli.api.CompilerApi,

  members: {
    load: async function () {
      let package = require("./package.json") || {};
      let cls = `
qx.Class.define("qx.tool.compiler.Version", {
  extend: qx.core.Object,
  statics: {
    VERSION: "${package.version}",
  }
});      
`;
      fs.writeFileSync("./source/class/qx/tool/compiler/Version.js", cls);
      return this.base(arguments);
    },
    /**
     * Register compiler tests
     * @param {qx.tool.cli.commands.Command} command
     * @return {Promise<void>}
     */
    async beforeTests(command) {
      const COMPILER_TEST_PATH = path.join("test", "compiler");
      function addTest(test) {
        command.addTest(new qx.tool.cli.api.Test(test, async function() {
          result = await qx.tool.utils.Utils.runCommand(COMPILER_TEST_PATH, "node", test + ".js");
          this.setExitCode(result.exitCode);
        })).setNeedsServer(false);
      }
      try {
        // add qx program with current build path to test directory.
        // this command is used in the defined tests as compiler
        let maker = command.getMakersForApp("compiler")[0];
        let compilerPath = path.resolve(path.join(maker.getOutputDir(), "compiler"));
        let cmd ="#!/usr/bin/env node\n" + `require("${compilerPath}");\n`;
        fs.writeFileSync("test/qx", cmd, {mode: 0o777});
        let files = fs.readdirSync(COMPILER_TEST_PATH);
        files.forEach(file => {
          if (fs.statSync(path.join(COMPILER_TEST_PATH, file))
            .isFile()) {
            addTest(path.changeExt(path.basename(file), ""));
          }
        });
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }
  }
});

module.exports = {
  CompilerApi: qx.compiler.CompilerApi
};
