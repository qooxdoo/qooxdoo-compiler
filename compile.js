qx.Class.define("qx.compiler.LibraryApi", {
  extend: qx.tool.cli.api.LibraryApi,

  members: {
    async load() {
      let command = this.getCompilerApi().getCommand();
      if (command instanceof qx.tool.cli.commands.Test) {
        command.addListener("runTests", this.__test1, this);
        command.addListener("runTests", this.__test2, this);
        command.addListener("runTests", this.__test3, this);
      }
    },

    /**
     * @param {qx.event.type.Data} evt Event which has the current command instance
     * of type {@link qx.tool.cli.commands.Test} as data.
     * @private
     */
    async __test1(evt) {
      const cmd = evt.getData();
      const test = new qx.tool.cli.api.Test("Test 1");
      cmd.registerTest(test);
      // do some async testing and set exit code explicitly
      await new qx.Promise(resolve =>  qx.event.Timer.once(resolve, null, 1000));
      test.setExitCode(0);
    },

    /**
     * @param {qx.event.type.Data} evt
     * @private
     */
    async __test2(evt) {
      const cmd = evt.getData();
      const test = new qx.tool.cli.api.Test("Test 2");
      cmd.registerTest(test);
      // do some async testing
      await new qx.Promise(resolve =>  qx.event.Timer.once(resolve, null, 1000));
      qx.tool.compiler.Console.info(`The next test fails on purpose.`);
      test.setExitCode(255);
    },

    /**
     * @param {qx.event.type.Data} evt
     * @private
     */
    async __test3(evt) {
      const cmd = evt.getData();
      const test = new qx.tool.cli.api.Test("Test 3");
      cmd.registerTest(test);
      // do some async testing
      await new qx.Promise(resolve =>  qx.event.Timer.once(resolve, null, 1000));
      test.setExitCode(0);
    },
  }
});

module.exports = {
  LibraryApi: qx.compiler.LibraryApi
};
