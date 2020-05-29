qx.Class.define("qx.compiler.LibraryApi", {
  extend: qx.tool.cli.api.LibraryApi,

  members: {
    async load() {
      let command = this.getCompilerApi().getCommand();
      if (command instanceof qx.tool.cli.commands.Test) {
      }
    }
  }
});

module.exports = {
  LibraryApi: qx.compiler.LibraryApi
};
