require("../lib");
const rimraf = require("rimraf");
const fs = qx.tool.compiler.utils.Promisify.fs;
const process = require("process");
const assert = require("assert");

const appNamespace = "testConfigSchemaApp";

(async () => {
  try {
    console.info("Running config file schema tests...");
    // delete existing app
    if (await fs.existsAsync(appNamespace) && await fs.statAsync(appNamespace)) {
      rimraf.sync(appNamespace);
    }
    // create a test app
    const appConfig = {noninteractive:true, namespace:appNamespace, theme: "Indigo", icontheme: "Tango"};
    await (new qx.tool.cli.commands.Create(appConfig)).process();
    process.chdir(appNamespace);
    // run tests
    const createInstance = qx.tool.compiler.utils.ConfigFile.getInstanceByType;
    const manifestConfig = await createInstance("manifest");
    // get a value
    assert.strictEqual(manifestConfig.getValue("provides.namespace"), appNamespace);
    // change a value
    manifestConfig.setValue("requires.@qooxdoo/framework", "^20.1.5");
    assert.strictEqual(manifestConfig.getValue("requires.@qooxdoo/framework"), "^20.1.5");
    // add new property
    manifestConfig.setValue("requires.foo", "^1.0.0");
    // do something illegal according to the schema
    assert.throws(() => manifestConfig.setValue("requires.@qooxdoo/framework", 42));
    assert.throws(() => manifestConfig.setValue("foo", "bar"));

    const compilerConfig = await createInstance("compile");
    assert.strictEqual(compilerConfig.getValue("applications.0.name"), appNamespace);

    // delete the test app
    process.chdir("..");
    rimraf.sync(appNamespace);
    console.info("All tests passed.");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
