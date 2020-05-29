qx.Class.define("qx.compiler.LibraryApi", {
  extend: qx.tool.cli.api.LibraryApi,

  members: {
    async load() {
      let command = this.getCompilerApi().getCommand();
      if (command instanceof qx.tool.cli.commands.Test) {
        command.addTest(new qx.tool.cli.api.Test("Test 0", this.__test0)).setNeedsServer(false);
        command.addTest(new qx.tool.cli.api.Test("Test 1", this.__test1)).setNeedsServer(false);
        command.addTest(new qx.tool.cli.api.Test("Test 2", this.__test2)).setNeedsServer(false);
        command.addTest(new qx.tool.cli.api.Test("Test 3")).set({needsServer: false, testFunction: this.__test3});
        command.addTest(new qx.tool.cli.api.Test("Test 4")).setNeedsServer(false);
      }
    },
    
    __test0() {
      this.setExitCode(0);
    },

    /**
     * @private
     */
    async __test1() {
      // do some async testing and set exit code explicitly
      await new qx.Promise(resolve =>  qx.event.Timer.once(resolve, null, 1000));
      this.setExitCode(0);
    },

    /**
     * @private
     */
    async __test2() {
      // do some async testing
      await new qx.Promise(resolve =>  qx.event.Timer.once(resolve, null, 1000));
      qx.tool.compiler.Console.info(`The next test fails on purpose.`);
      this.setExitCode(255);
    },

    /**
     * @private
     */
    async __test3() {
      // do some async testing
      await new qx.Promise(resolve =>  qx.event.Timer.once(resolve, null, 1000));
      this.setExitCode(0);
    },
  }
});

module.exports = {
  LibraryApi: qx.compiler.LibraryApi
};
