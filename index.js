/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2018 Zenesis Ltd

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * John Spackman (john.spackman@zenesis.com, @johnspackman)

************************************************************************ */

require("@qooxdoo/framework");
if (qx.tool === undefined) {
  qx.tool = {
    $$rootDir: __dirname,
    $$sourceDir: __dirname + "/source/class/qx/tool",
    $$resourceDir: __dirname + "/source/resource/qx/tool"
  };
}

require("./source/class/qx/tool/utils");
require("./source/class/qx/tool/compiler");
require("./source/class/qx/tool/cli");

const updateNotifier = require("update-notifier");
const pkg = require("./package.json");
updateNotifier({pkg}).notify({defer:false});
