var test = require("tape");
require("../index");

test("test issue 519", assert => {
  try {  
    var lib = new qx.tool.compiler.app.Library();
    var analyser = new qx.tool.compiler.Analyser();
    analyser.setOutputDir(".");
    lib.setRootDir(".");
    lib.setSourcePath("test-compiler");
    lib.getSourceFileExtension = () => ".js";
    var classFile = new qx.tool.compiler.ClassFile(analyser, "classIssue519", lib);
    classFile.load(() => {
      var dbClassInfo = {};
      classFile.writeDbInfo(dbClassInfo);
      assert.ok(!dbClassInfo.unresolved)
      assert.end();
    });
  }catch(ex) {
    assert.end(ex);
  }
})
