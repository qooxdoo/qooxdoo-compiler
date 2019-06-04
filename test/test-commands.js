require("../index");
const rimraf = require("rimraf");
const fs = qx.tool.utils.Promisify.fs;
const process = require("process");
const assert = require("assert");
const path = require("path");

const appNamespace = "testCommandsApp";

(async () => {
  try {
    console.info("Running command tests...");
    // delete existing app
    if (await fs.existsAsync(appNamespace) && await fs.statAsync(appNamespace)) {
      rimraf.sync(appNamespace);
    }
    // create a test app
    const commands = qx.tool.cli.commands;
    const appConfig = {noninteractive:true, namespace:appNamespace, theme: "Indigo", icontheme: "Tango"};
    await (new commands.Create(appConfig)).process();
    process.chdir(appNamespace);
    // run tests
    let actual; 
    let expected;
    const manifestModel = await qx.tool.config.Manifest.getInstance().load();

    // qx add script --rename=y.js test/testdata/x.js
    let filename = "x.js";
    let scriptpath = path.join(qx.tool.$$rootDir, "test/testdata", filename);
    let resourcedir = "js";
    let args = {verbose:true, noninteractive:true, scriptpath, resourcedir, rename:"y.js"};
    await (new commands.add.Script(args)).process();
    actual = manifestModel.getValue("externalResources.script.0");
    expected = path.join(appNamespace, resourcedir, "y.js");
    assert.strictEqual(actual, expected);
    let filePath = path.join(process.cwd(), "source/resource", expected);
    assert.ok(await fs.existsAsync(filePath), "File was not copied.");

    // qx add script --undo --rename=y.js test/testdata/x.js
    args.undo = true;
    await (new commands.add.Script(args)).process();
    actual = manifestModel.getValue("externalResources.script").length;
    expected = 0;
    assert.strictEqual(actual, expected);
    assert.ok(!await fs.existsAsync(filePath), "File was not removed.");

    // delete the test app
    process.chdir("..");
    rimraf.sync(appNamespace);
    console.info("All tests passed.");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
