/**
 * @asset(testTargetsApp/*)
 */
qx.Class.define("testTargetsApp.Application", {
  extend: qx.application.Standalone,

  members: {
    /**
     * @lint ignoreDeprecated(alert)
     */
    main: function() {
      this.base(arguments);
      if (qx.core.Environment.get("qx.debug")) {
        qx.log.appender.Native;
        qx.log.appender.Console;
      }

      var button1 = new qx.ui.form.Button("Click me", "testTargetsApp/test.png");
      var doc = this.getRoot();
      doc.add(button1, {
        left: 100,
        top: 50
      });
      
      var atom = new qx.ui.basic.Atom("Look, I'm a font icon", "@FontAwesome/heart");
      doc.add(atom, {
        left: 100,
        top: 250
      });

      qx.io.PartLoader.require("pluginFramework", function() {
        qx.io.PartLoader.require("pluginOne", function() {
          this.debug("pluginOne loaded");
          var plugin = new testTargetsApp.plugins.PluginOne();
          console.log(plugin.sayHello());
        }, this);
        qx.io.PartLoader.require("pluginTwo", function() {
          this.debug("pluginTwo loaded");
          var plugin = new testTargetsApp.plugins.PluginTwo();
          console.log(plugin.sayHello());
        }, this);
      }, this);

      // Nothing until the locale has been loaded as a part
      qx.core.Assert.assertTrue(this.tr("translatedString") == "translatedString");
      qx.io.PartLoader.require("en", () => {
        qx.core.Assert.assertTrue(this.tr("translatedString") == "en: translatedString");
        qx.core.Assert.assertTrue(this.tr("Call \"me\"") == "en: Call \"me\"");
        qx.core.Assert.assertTrue(this.tr("This has\nsome\nnewlines") == "en: This has\nsome\nnewlines");
      });
      

      button1.addListener("execute", function() {
        /* eslint no-alert: "off" */
        alert("Hello World!");
      });
    }
  }
});