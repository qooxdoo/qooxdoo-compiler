qx.Class.define("testTargetsApp.pdk.AbstractPlugin", {
  extend: qx.core.Object,
  
  members: {
    sayHello: function() {
      this.assertEquals("testTargetsApp.Application", testTargetsApp.Application.classname);
      return this.classname + ": Abstract Hello";
    }
  }
});
