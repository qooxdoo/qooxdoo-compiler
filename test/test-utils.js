var test = require("tape");
var fs = require("fs");
var fsPromises = require("fs").promises;
var async = require("async");
const child_process = require("child_process");
const stream = require("stream");
require("../index");

test("StripSourceMapWriteStream - whole stream", async assert => {
  try {
    let ss = new qx.tool.utils.Utils.ToStringWriteStream();
    let ws = new qx.tool.utils.Utils.StripSourceMapTransform();
    ws.pipe(ss);
    
    await new Promise(resolve => {
      ws.on("finish", () => {
        resolve();
      });
      ws.write("abc\ndef\n//# sourceMappingURL=IApplication.js.map?dt=1587127076441\nghi");
      ws.end();
    });
    assert.ok(ss.toString() == "abc\ndef\nghi");
  
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

test("StripSourceMapWriteStream - chunked 1", async assert => {
  try {
    let ss = new qx.tool.utils.Utils.ToStringWriteStream();
    let ws = new qx.tool.utils.Utils.StripSourceMapTransform();
    ws.pipe(ss);

    await new Promise(resolve => {
      ws.on("finish", () => {
        resolve();
      });
      ws.write("abc\ndef\n//# source");
      ws.write("MappingURL=IApplication.js.map?dt=1587127076441\nghi\njkl");
      ws.end();
    });
    assert.ok(ss.toString() == "abc\ndef\nghi\njkl");
  
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

test("StripSourceMapWriteStream - chunked 2", async assert => {
  try {
    let ss = new qx.tool.utils.Utils.ToStringWriteStream();
    let ws = new qx.tool.utils.Utils.StripSourceMapTransform();
    ws.pipe(ss);
    
    await new Promise(resolve => {
      ws.on("finish", () => {
        resolve();
      });
      ws.write("abc\ndef\n//# source");
      ws.write("MappingURL=IApplication.js.map?dt=1587127076441");
      ws.write("\nghi");
      ws.end();
    });
    assert.ok(ss.toString() == "abc\ndef\nghi");
  
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

