var test = require("tape");
require("../index");

var lib = new qx.tool.compiler.app.Library();
var analyser = new qx.tool.compiler.Analyser();
analyser.setOutputDir(".");
lib.setRootDir(".");
lib.setSourcePath("test-compiler");
lib.getSourceFileExtension = () => ".js";

test("test issue 633", assert => {
  try {  
    var classFile = new qx.tool.compiler.ClassFile(analyser, "classIssue633", lib);
    classFile.load(() => {
      var dbClassInfo = {};
      classFile.writeDbInfo(dbClassInfo);
      assert.ok(!dbClassInfo.unresolved);
      assert.end();
    });
  }catch(ex) {
    assert.end(ex);
  }
});

test("test issue 519", assert => {
  try {  
    var classFile = new qx.tool.compiler.ClassFile(analyser, "classIssue519", lib);
    classFile.load(() => {
      var dbClassInfo = {};
      classFile.writeDbInfo(dbClassInfo);
      assert.ok(!dbClassInfo.unresolved);
      assert.end();
    });
  }catch(ex) {
    assert.end(ex);
  }
});

test("test issue 524", assert => {
  try {  
    var classFile = new qx.tool.compiler.ClassFile(analyser, "classIssue524", lib);
    classFile.load(() => {
      var dbClassInfo = {};
      classFile.writeDbInfo(dbClassInfo);
      assert.ok(!dbClassInfo.unresolved);
      assert.end();
    });
  }catch(ex) {
    assert.end(ex);
  }
});

test("test issue 517", assert => {
  try {  
    var classFile = new qx.tool.compiler.ClassFile(analyser, "classIssue517", lib);
    classFile.load(() => {
      var dbClassInfo = {};
      classFile.writeDbInfo(dbClassInfo);
      assert.end();
    });
  }catch(ex) {
    assert.end(ex);
  }
});
