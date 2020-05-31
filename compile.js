const testUtils = require("./test/utils");


qx.Class.define("qx.compiler.LibraryApi", {
  extend: qx.tool.cli.api.LibraryApi,

  members: {
    async load() {
      let command = this.getCompilerApi().getCommand();
      if (command instanceof qx.tool.cli.commands.Test) {
        command.addTest(new qx.tool.cli.api.Test("test-cli", async () => {
          result = await testUtils.runCommand("test", "node", "test-cli.js");
          this.setErrorCode(result.errorCode);
        })).setNeedsServer(false);
      }
    }
  }
});

module.exports = {
  LibraryApi: qx.compiler.LibraryApi
};
