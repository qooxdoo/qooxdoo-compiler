const fs = require("fs");
const path = require("path");

qx.Class.define("qxl.compilertests.testlib.CompilerConfig", {
  extend: qx.tool.cli.config.CompilerConfig,
  
  members: {
    async load() {
      let data = await this.base(arguments);
      if (!data.environment)
        data.environment = {};
      data.environment.testlibCompilerConfig = "two";
      return data;
    }
  }
});

qx.Class.define("qxl.compilertests.testlib.LibraryConfig", {
  extend: qx.tool.cli.config.LibraryConfig,
  
  members: {
    async load() {
      let command = this.getCompilerConfig().getCommand();
      command.addListener("checkEnvironment", e => this._appCompiling(e.getData().application, e.getData().environment));
    },
    
    _appCompiling(application, environment) {
      environment.testlibLibraryConfig = "one";
    }
  }
});

module.exports = {
    LibraryConfig: qxl.compilertests.testlib.LibraryConfig,
    CompilerConfig: qxl.compilertests.testlib.CompilerConfig
};
