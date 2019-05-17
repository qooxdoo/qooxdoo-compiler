require("../lib");
const rimraf = require("rimraf");
const fs = qx.tool.compiler.utils.Promisify.fs;
const process = require("process");

const appNamespace = "testConfigSchemaApp";
(async () => {
  try {
    // delete existing app
    if (await fs.existsAsync(appNamespace) && await fs.statAsync(appNamespace)) {
      rimraf.sync(appNamespace);
    }
    // create app
    const appConfig = {noninteractive:true, namespace:appNamespace, theme: "Indigo", icontheme: "Tango"};
    await (new qx.tool.cli.commands.Create(appConfig)).process();

    process.chdir(appNamespace);

    const createInstance = qx.tool.compiler.utils.ConfigFile.getInstanceByType;
    const manifestConfig = await createInstance("manifest");
    console.log(manifestConfig.getValue("provides"));
    const compilerConfig = await createInstance("compile");
    console.info(compilerConfig.getValue("applications"));
    // delete the test app
    process.chdir("..");
    rimraf.sync(appNamespace);
  } catch (e) {
    console.error(e.message);
  }
})();
