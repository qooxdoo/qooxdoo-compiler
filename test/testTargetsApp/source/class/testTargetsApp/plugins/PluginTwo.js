qx.Class.define("testTargetsApp.plugins.PluginTwo", {
  extend: testTargetsApp.pdk.AbstractPlugin,
  
  members: {
    sayHello: function() {
      this.assertEquals("testTargetsApp.Application", testTargetsApp.Application.classname);
      testTargetsApp.plugins.TwoAlpha;
      testTargetsApp.plugins.TwoBravo;
      testTargetsApp.plugins.TwoCharlie;
      return this.classname + ": Plugin Two Hello\n";
    }
  }
});
