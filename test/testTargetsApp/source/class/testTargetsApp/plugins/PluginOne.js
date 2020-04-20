qx.Class.define("testTargetsApp.plugins.PluginOne", {
  extend: testTargetsApp.pdk.AbstractPlugin,
  
  members: {
    sayHello: function() {
      this.assertEquals("testTargetsApp.Application", testTargetsApp.Application.classname);
      testTargetsApp.plugins.OneAlpha;
      testTargetsApp.plugins.OneBravo;
      testTargetsApp.plugins.OneCharlie;
      return this.classname + ": Plugin One Hello\n";
    }
  }
});
