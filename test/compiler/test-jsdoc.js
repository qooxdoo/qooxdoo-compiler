var test = require("tape");
require("../index");

test("JS Doc parser", assert => {
  let data = qx.tool.compiler.jsdoc.Parser.parseComment(
    " *\n" + 
    " * @asset(qx/test/webfonts/fontawesome-webfont.*)\n" + 
    " * @asset(qx/icon/Tango/48/places/folder.png)\n" + 
    " * @asset(qx/icon/Tango/32/places/folder.png)\n" +
    " * @asset(qx/static/blank.gif)\n" +
    " * @asset(qx/static/drawer.png)\n" +
    " * @asset(qx/static/drawer@2x.png)");
  assert.ok(!!data["@asset"] && data["@asset"].length == 6);
});
