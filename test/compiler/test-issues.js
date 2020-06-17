const test = require("tape");
const fs = require("fs");
const testUtils = require("../utils");
const fsPromises = testUtils.fsPromises;

test("Issue553", async assert => {
  try {
    await testUtils.deleteRecursive("test-issues/issue553/compiled");
    await testUtils.runCompiler("test-issues/issue553");
    assert.ok(fs.existsSync("test-issues/issue553/compiled/source/index.html"));
    let indexHtml = await fsPromises.readFile("test-issues/issue553/compiled/source/index.html", "utf8");
    assert.ok(!!indexHtml.match(/issue553one\/index.js/m));
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

test("Dynamic commands", async assert => {
  try {
    await testUtils.deleteRecursive("test-issues/testdynamic/compiled");
    let result = await testUtils.runCommand("test-issues/testdynamic", testUtils.getCompiler(), "testlib", "hello", "-t=4");
    assert.ok(result.output.match(/The commmand testlib; message=hello, type=4/));
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

test("Issue440", async assert => {
  try {
    await testUtils.deleteRecursive("test-issues/issue440/compiled");
    let code = await fsPromises.readFile("test-issues/issue440/source/class/issue440/Application.js", "utf8");
    code = code.split("\n");
    let errorLine = -1;
    code.forEach((line, index) => {
      if (line.match(/This is an error/i))
        errorLine = index;
    });
    let result;
    code[errorLine] = "This is an error";
    await fsPromises.writeFile("test-issues/issue440/source/class/issue440/Application.js", code.join("\n"), "utf8");
    result = await testUtils.runCompiler("test-issues/issue440");
    assert.ok(result.exitCode === 1);

    code[errorLine] = "new abc.ClassNoDef(); //This is an error";
    await fsPromises.writeFile("test-issues/issue440/source/class/issue440/Application.js", code.join("\n"), "utf8");
    result = await testUtils.runCompiler("test-issues/issue440", "--warnAsError");
    assert.ok(result.exitCode === 1);

    code[errorLine] = "new abc.ClassNoDef(); //This is an error";
    await fsPromises.writeFile("test-issues/issue440/source/class/issue440/Application.js", code.join("\n"), "utf8");
    result = await testUtils.runCompiler("test-issues/issue440");
    assert.ok(result.exitCode === 0);

    code[errorLine] = "//This is an error";
    await fsPromises.writeFile("test-issues/issue440/source/class/issue440/Application.js", code.join("\n"), "utf8");
    result = await testUtils.runCompiler("test-issues/issue440");
    assert.ok(result.exitCode === 0);
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

test("testLegalSCSS", async assert => {
  try {
    let result;
    await testUtils.deleteRecursive("test-issues/testLegalSCSS/compiled");
    result = await testUtils.runCompiler("test-issues/testLegalSCSS");
    assert.ok(result.exitCode === 0);
    assert.ok(fs.existsSync("test-issues/testLegalSCSS/compiled/source/resource/testLegalSCSS/css/test_css.css"));
    assert.ok(fs.existsSync("test-issues/testLegalSCSS/compiled/source/resource/testLegalSCSS/css/test_scss.css"));
    assert.ok(fs.existsSync("test-issues/testLegalSCSS/compiled/source/resource/testLegalSCSS/css/test_theme_scss.css"));
    assert.ok(fs.existsSync("test-issues/testLegalSCSS/compiled/source/testLegalSCSS/index.js"));
    let bootJS = await fsPromises.readFile("test-issues/testLegalSCSS/compiled/source/testLegalSCSS/index.js", "utf8");
    let pos1 = bootJS.indexOf("cssBefore");
    let pos2 = bootJS.indexOf("]", pos1 + 1);
    let test = bootJS.substring(pos1, pos2 + 1);
    assert.ok(test.indexOf("testLegalSCSS/css/test_css.css") > 0);
    assert.ok(test.indexOf("testLegalSCSS/css/test_scss.css") > 0);
    assert.ok(test.indexOf("testLegalSCSS/css/test_theme_scss.css") > 0);
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

