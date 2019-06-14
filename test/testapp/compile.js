const fs = require("fs");
const path = require("path");

qx.Class.define("qxl.compilertests.testapp.CompilerConfig", {
  extend: qx.tool.cli.config.CompilerConfig,
  
  members: {
    async load() {
      let data = await this.base(arguments);
      if (!data.environment)
        data.environment = {};
      data.environment.testappCompilerConfig = "two";
      return data;
    }
  }
});

qx.Class.define("qxl.compilertests.testapp.LibraryConfig", {
  extend: qx.tool.cli.config.LibraryConfig,
  
  members: {
    async load() {
      let command = this.getCompilerConfig().getCommand();
      command.addListener("checkEnvironment", e => this._appCompiling(e.getData().application, e.getData().environment));
    },
    
    _appCompiling(application, environment) {
      environment.testappLibraryConfig = "one";
    }
  }
});

module.exports = {
    LibraryConfig: qxl.compilertests.testapp.LibraryConfig,
    CompilerConfig: qxl.compilertests.testapp.CompilerConfig
};
