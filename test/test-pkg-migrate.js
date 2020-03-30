require("../index");
const rimraf = require("rimraf");
const fs = qx.tool.utils.Promisify.fs;
const process = require("process");
const download = require("download");


const appNamespace = "testMigrateApp";

(async () => {
  try {
    console.info("Running migration tests...");
    // delete existing app
    if (await fs.existsAsync(appNamespace) && await fs.statAsync(appNamespace)) {
      rimraf.sync(appNamespace);
    }

    // download legacy format library
    await download("https://github.com/qooxdoo/qxl.apiviewer/archive/v0.1.14.zip", appNamespace, {extract:true, strip: 1});
    process.chdir(appNamespace);
    // migrate
    await (new qx.tool.cli.commands.package.Migrate({verbose:true})).process();
    // compile (doesn't work like this)
    //await (new qx.tool.cli.commands.Compile({feedback:false, target:"source"})).process();

    // delete the test app
    process.chdir("..");
    rimraf.sync(appNamespace);
    console.info("All tests passed.");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
