const testUtils = require("./test/utils");
const fs = require("fs");
const path = require("upath");

qx.Class.define("qx.compiler.LibraryApi", {
  extend: qx.tool.cli.api.LibraryApi,

  members: {
    async load() {
      const COMPILER_TEST_PATH = path.join("test", "compiler");
      let self = this;
     

      function addTest(test) {
        command.addTest(new qx.tool.cli.api.Test(test, async function() {
          result = await testUtils.runCommand(COMPILER_TEST_PATH, "node", test + ".js");
          this.setExitCode(result.exitCode);
        })).setNeedsServer(false);
      }

      let command = this.getCompilerApi().getCommand();
      if (command instanceof qx.tool.cli.commands.Test) {
        command.addListener("writtenApplication", async (evt) => {
          let app = evt.getData();
          if (app.getName() !== "compiler") {
            return;
          }
          // add qx program with current build path to test directory.
          // this command is used in the defined tests as compiler
          let maker = command.getMakersForApp("compiler")[0];
          let cmd =
`#!/usr/bin/env node
require("${path.resolve(path.join(maker.getOutputDir(), "compiler"))}");
`;
          await testUtils.safeDelete("test/qx");
          fs.writeFileSync("test/qx", cmd, { mode: 0o777 });
        });
        let files = fs.readdirSync(COMPILER_TEST_PATH);
        // node 8 compatible...
        files.forEach(file => {
          if (fs.statSync(path.join(COMPILER_TEST_PATH, file)).isFile()) {
            addTest(path.changeExt(path.basename(file), ""));
          }
        });
      }
    }
  }
});

module.exports = {
  LibraryApi: qx.compiler.LibraryApi
};
