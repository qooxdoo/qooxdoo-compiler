const testUtils = require("./test/utils");
const fs = require("fs");
const path = require("upath");

qx.Class.define("qx.compiler.LibraryApi", {
  extend: qx.tool.cli.api.LibraryApi,

  members: {
    async load() {
      let self = this;

      function addTest(test) {
        command.addTest(new qx.tool.cli.api.Test(test, async () => {
          result = await testUtils.runCommand(path.join("test", "compiler"), "node", test + ".js");
          self.setErrorCode(result.errorCode);
        })).setNeedsServer(false);
      }

      let command = this.getCompilerApi().getCommand();
      if (command instanceof qx.tool.cli.commands.Test) {
        command.addListener("writtenApplication", async (evt) => {
          let app = evt.getData();
          if (app.getName() !== "compiler") {
            return;
          }
          let maker = command.getMakersForApp("compiler")[0];
          let cmd =
            `#!/usr/bin/env node
             require("${path.resolve(path.join(maker.getOutputDir(), "compiler"))}");
`;
          await testUtils.safeDelete("test/qx");
          fs.writeFileSync("test/qx", cmd, { mode: 777 });
        });
        let files = fs.readdirSync("test/compiler");
        // node 8 compatible...
        files.forEach(file => {
          if (fs.statSync(path.join("test/compiler", file)).isFile()) {
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
