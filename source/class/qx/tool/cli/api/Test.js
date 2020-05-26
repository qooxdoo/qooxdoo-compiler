/**
 * This is used by listeners of the "runTests" event
 */
qx.Class.define("qx.tool.cli.api.Test", {
  extend: qx.core.Object,
  construct: function(name) {
    this.base(arguments);
    this.setName(name);
  },
  properties: {
    name: {
      check: "String",
      event: "changeName"
    },
    description: {
      check: "String",
      event: "changeDescription"
    },
    exitCode: {
      check: "Number",
      event: "changeExitCode",
      nullable: true,
      init: null
    }
  }
});
