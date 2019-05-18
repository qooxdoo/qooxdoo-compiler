/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2019 The qooxdoo developers

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Boulanger (info@bibliograph.org, @cboulanger)

************************************************************************ */
const path = require("path");

/**
 * This class contains constants used for locating and versioning
 * of the different configuration files
 */
qx.Class.define("qx.tool.ConfigSchemas", {

  statics: {

    /**
     * The base URL of all json schema definitions, without trailing slash
     */
    schemaBaseUrl: "https://raw.githubusercontent.com/qooxdoo/qooxdoo-compiler/master/resource/schema",

    /**
     * The base dir of the
     */
    schemaBaseDir: path.join(__dirname, "/../../../resource/schema"),

    /**
     * The library manifest
     */
    manifest: {
      filename: "Manifest.json",
      version: "1"
    },

    /**
     * The compiler instructions
     */
    compile: {
      filename: "compile.json",
      version: "1"
    },

    /**
     * The lockfile with library versions etc.
     */
    lockfile: {
      filename: "qx-lock.json",
      legacy_filename: "contrib.json",
      version: "2.1"
    },

    /**
     * The library registry in a repository
     */
    registry: {
      filename: "qooxdoo.json",
      version: "1"
    }
  }
});
