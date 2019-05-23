/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2017 Christian Boulanger

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Boulanger (info@bibliograph.org, @cboulanger)

************************************************************************ */
require("../Package");

require("@qooxdoo/framework");
const process = require("process");
const path = require("upath");
const semver = require("semver");

/**
 * Installs a package
 */
qx.Class.define("qx.tool.cli.commands.package.Migrate", {
  extend: qx.tool.cli.commands.Package,

  statics: {
    /**
     * Flag to prevent recursive call to process()
     */
    migrationInProcess: false,
    /**
     * Return the Yargs configuration object
     * @return {{}}
     */
    getYargsCommand: function() {
      return {
        command: "migrate",
        describe: "migrates the package system to a newer version.",
        builder: {
          "verbose": {
            alias: "v",
            describe: "Verbose logging"
          },
          "quiet": {
            alias: "q",
            describe: "No output"
          }
        },
        handler: function(argv) {
          return new qx.tool.cli.commands.package.Migrate(argv)
            .process()
            .catch(e => {
              console.error(e.stack || e.message);
              process.exit(1);
            });
        }
      };
    }
  },

  members: {
    /**
     * Announces or applies a migration
     * @param {Boolean} announceOnly If true, announce the migration without
     * applying it.
     */
    process: async function(announceOnly=false) {
      const self = qx.tool.cli.commands.package.Migrate;
      if (self.migrationInProcess) {
        return;
      }
      self.migrationInProcess = true;
      let change = false;
      // do not call this.base(arguments) here!
      let pkg = qx.tool.cli.commands.Package;
      let cwd = process.cwd();
      let migrateFiles = [
        [
          path.join(cwd, pkg.lockfile.filename),
          path.join(cwd, pkg.lockfile.legacy_filename)
        ],
        [
          path.join(cwd, pkg.cache_dir),
          path.join(cwd, pkg.legacy_cache_dir)
        ],
        [
          path.join(qx.tool.cli.ConfigDb.getDirectory(), pkg.package_cache_name),
          path.join(qx.tool.cli.ConfigDb.getDirectory(), pkg.legacy_package_cache_name)
        ]
      ];
      if (this.checkFilesToRename(migrateFiles).length) {
        let replaceInFiles = [{
          files: path.join(cwd, ".gitignore"),
          from: pkg.legacy_cache_dir + "/",
          to: pkg.cache_dir + "/"
        }];
        await this.migrate(migrateFiles, replaceInFiles, announceOnly);
        if (!announceOnly) {
          if (!this.argv.quiet) {
            console.info("Fixing path names in the lockfile...");
          }
          this.argv.reinstall = true;
          await (new qx.tool.cli.commands.package.Upgrade(this.argv)).process();
          change = true;
        }
      }
      const manifestModel = await qx.tool.config.Manifest.getInstance().set({warnOnly: true}).load();
      // fix deprecated properties etc.
      manifestModel
        .transform("info.authors", authors => {
          if (authors === "") {
            return [];
          } else if (qx.lang.Type.isString(authors)) {
            return [{name: authors}];
          } else if (qx.lang.Type.isObject(authors)) {
            return authors;
          }
          return [];
        })
        .transform("info.version", version => String(semver.coerce(version)))
        .unset("info.qooxdoo-versions")
        .unset("info.qooxdoo-range")
        .unset("provides.type")
        .unset("requires.qxcompiler")
        .unset("requires.qooxdoo-sdk")
        .unset("requires.qooxdoo-compiler")
        .unset("requires.qooxdoo-sdk");

      // update dependencies
      if (!manifestModel.getValue("requires.@qooxdoo/compiler") || !manifestModel.getValue("requires.@qooxdoo/framework")) {
        if (announceOnly) {
          console.info("*** Framework and/or compiler dependencies in Manifest need to be updated.");
        } else {
          change = true;
          manifestModel
            .setValue("requires.@qooxdoo/compiler", "^" + qx.tool.compiler.Version.VERSION)
            .setValue("requires.@qooxdoo/framework", "^" + await this.getLibraryVersion(await this.getGlobalQxPath()));
          manifestModel.setWarnOnly(false);
          // now model should validate
          if (!this.argv.quiet) {
            console.info("Updated dependencies in Manifest.");
            console.info("Migration is completed.");
          }
        }
      }
      await manifestModel.save();
      self.migrationInProcess = false;
      if (change && announceOnly) {
        console.error(`*** Please run 'qx package migrate' to apply the changes. If you don't want this, downgrade to a previous version of the compiler.`);
        process.exit(1);
      }
    }
  }
});
