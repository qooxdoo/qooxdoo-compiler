const fs = require("fs");
const path = require("path");

qx.Class.define("qxl.compilertests.testapp.CompilerApi", {
  extend: qx.tool.cli.api.CompilerApi,
  
  members: {
    async load() {
      let data = await this.base(arguments);
      if (!data.environment)
        data.environment = {};
      data.environment.testappCompilerApi = "two";
      return data;
    }
  }
});

qx.Class.define("qxl.compilertests.testapp.LibraryApi", {
  extend: qx.tool.cli.api.LibraryApi,
  
  members: {
    async load() {
      let command = this.getCompilerApi().getCommand();
      command.addListener("checkEnvironment", e => this._appCompiling(e.getData().application, e.getData().environment));
    },
    
    _appCompiling(application, environment) {
      environment.testappLibraryApi = "one";
    }
  }
});

module.exports = {
    LibraryApi: qxl.compilertests.testapp.LibraryApi,
    CompilerApi: qxl.compilertests.testapp.CompilerApi
};
