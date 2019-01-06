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

/* global qxcli */

require("../Contrib");

require("qooxdoo");
const download = require("download");
const fs = qx.tool.compiler.utils.Promisify.fs;
const path = require("upath");
const process = require("process");
const semver = require("semver");

/**
 * Installs a contrib libraries
 */
qx.Class.define("qx.tool.cli.commands.contrib.Install", {
  extend: qx.tool.cli.commands.Contrib,

  statics: {
    getYargsCommand: function() {
      return {
        command: "install [repository[@release_tag]]",
        describe: "installs the latest compatible release of a contrib library (as per Manifest.json). Use \"-r <release tag>\" or @<release tag> to install a particular release.",
        builder: {
          "release" : {
            alias: "r",
            describe: "use a specific release tag instead of the tag of the latest compatible release",
            nargs: 1,
            requiresArg: true,
            type: "string"
          },
          "ignore" : {
            alias: "i",
            describe: "ignore unmatch of qooxdoo"
          },
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
          return new qx.tool.cli.commands.contrib.Install(argv)
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
     * Lists contrib libraries compatible with the current project
     */
    process: async function() {
      let argv = this.argv;
      let repos_cache = this.getCache().repos;
      if (repos_cache.list.length === 0) {
        if (!this.argv.quiet) {
          console.info("Updating cache...");
        }
        this.clearCache();
        // implicit update
        await (new qx.tool.cli.commands.contrib.Update({quiet:true})).process();
        await (new qx.tool.cli.commands.contrib.List({quiet:true})).process();
      }

      if (!argv["repository@release_tag"]) {
        await this.__loadFromContribJson();
        return;
      }

      if (!argv.release) {
        let s = argv["repository@release_tag"].split(/@/);
        argv["repository@release_tag"] = s[0];
        argv.release = s[1];
      }
      argv.release = await this.__installRepo(argv["repository@release_tag"], argv.release);
      await this.__writeRequieredToManifest(argv["repository@release_tag"], argv.release);
      if (argv.verbose) {
        console.info(">>> Done.");
      }
    },

    __writeRequieredToManifest: async function(repoName, tagName) {
      let manifest = await qx.tool.compiler.utils.Json.loadJsonAsync("Manifest.json");
      if (!manifest.requires) {
        manifest.requires = {};
      }
      if (!manifest.requires[repoName]) {
        manifest.requires[repoName] = tagName.substring(1);
        await qx.tool.compiler.utils.Json.saveJsonAsync("Manifest.json", manifest);
      }
    },
    
    __installRepo: async function(repoName, tagName) {
      let argv = this.argv;
      let qooxdoo_version = await this.getUserQxVersion();
      if (argv.verbose) {
        console.info(`>>> qooxdoo version:  ${qooxdoo_version}`);
      }
      let cache = this.getCache();

      if (!cache.repos.data[repoName]) {
        throw new qx.tool.cli.Utils.UserError(`'${repoName}' does not exist or is not a contrib library.`);
      }

      // get compatible tag name unless a release name has been given
      if (!tagName) {
        if (cache.compat[qooxdoo_version] === undefined) {
          if (!this.argv.quiet) {
            console.info("Updating cache...");
          }
          await (new qx.tool.cli.commands.contrib.List({quiet:true})).process();
          cache = this.getCache(true);
        }
        tagName = cache.compat[qooxdoo_version][repoName];
        if (!tagName) {
          throw new qx.tool.cli.Utils.UserError(
            `'${repoName}' has no stable release compatible with qooxdoo version ${qooxdoo_version}.
             To install anyways, use --release x.y.z. 
             Please ask the contrib maintainer to release a compatible version`);
        }
      }
      let {release_data, download_path} = await this.__download(repoName, tagName);

      // read libraries array from contrib.json
      let data = await this.getContribData();

      // iterate over contained libraries
      let library_elem = null;
      for (let {info, path:filename} of release_data.manifests) {
        // does the repository name already exist?
        let index = data.libraries.findIndex(elem => elem.repo_name === repoName && elem.library_name === info.name);
        library_elem = {
          library_name : info.name,
          library_version : info.version,
          repo_name : repoName,
          repo_tag : tagName,
          path : path.relative(process.cwd(), path.join(download_path, path.dirname(filename)))
        };
        if (index >= 0) {
          let oldVersion = data.libraries[index].library_version;
          data.libraries[index]=library_elem;
          if (!argv.quiet) {
            console.info(`Updating already existing config.json entry '${library_elem.repo_name}@${oldVersion} with ${library_elem.repo_name}@${info.version}'.`);
          }
        } else {
          data.libraries.push(library_elem);
        }
      }
      await fs.writeFileAsync(this.getContribFileName(), JSON.stringify(data, null, 2), "utf-8");
      await this.installApplication(repoName);
      await this.installDependencies(repoName);
      return tagName;
    },

    installDependencies: async function(repoName) {
      let contribJson = await this.getContribData();
      let libraryJson = contribJson.libraries.find(data => data.repo_name === repoName);
      if (!libraryJson) {
        throw new qx.tool.cli.Utils.UserError("Repo for " + repoName + " is not installed as a contrib");
      }
      let manifest = await qx.tool.compiler.utils.Json.loadJsonAsync(path.join(libraryJson.path, "Manifest.json"));
      if (!manifest.requires) {
        if (this.argv.verbose) {
          console.info(">>> No dependencies to install.");
        }
        return;
      }
      for (let lib_name of Object.getOwnPropertyNames(manifest.requires)) {
        let lib_version = manifest.requires[lib_name];
        switch (lib_name) {
          case "qooxdoo-sdk":
            let qxVer = await this.getUserQxVersion();
            if (!semver.satisfies(qxVer, lib_version, {loose: true}) && argv.ignore) {
              throw new qx.tool.cli.Utils.UserError(
                `Contrib needs qooxdoo-sdk version ${lib_version}, found ${qxVer}`
              );
            }
            break;
          default:
            let lib = this.getCache().repos.data[lib_name];
            if (!lib) {
              throw new qx.tool.cli.Utils.UserError(`${lib_name} is not an contrib!`);
            }
            let versionList = [];
            lib.releases.list.forEach(elem => versionList.push(elem.substring(1)));
            let version = semver.maxSatisfying(versionList, lib_version, {loose: true});
            if (!version) {
              throw new qx.tool.cli.Utils.UserError(`No satisfying version found for ${lib_name}@${lib_version}!`);
            }
            await this.__installRepo(lib_name, `v${version}`);
            break;
        }
      };
    },

    installApplication: async function(repoName) {
      let contribJson = await this.getContribData();
      let libraryJson = contribJson.libraries.find(data => data.repo_name === repoName);
      if (!libraryJson) {
        throw new Error("Repo for " + repoName + " is not installed as a contrib");
      }

      let manifest = await qx.tool.compiler.utils.Json.loadJsonAsync(path.join(libraryJson.path, "Manifest.json"));
      if (!manifest.provides || !manifest.provides.application) {
        if (this.argv.verbose) {
          console.info(">>> No application to install.");
        }
        return;
      }

      let compileJson = await qx.tool.compiler.utils.Json.loadJsonAsync("compile.json");
      let manifestApp = manifest.provides.application;
      let app = compileJson.applications.find(app => {
        if (manifestApp.name && app.name) {
          return manifestApp.name === app.name;
        }
        return manifestApp["class"] === app["class"];
      });
      if (!app) {
        compileJson.applications.push(manifestApp);
        app = manifestApp;
      } else {
        for (let key in manifestApp) {
          app[key] = manifestApp[key];
        }
      }
      if (this.argv.verbose) {
        console.info(">>> Installed application " + (app.name||app["class"]));
      }

      return await qx.tool.compiler.utils.Json.saveJsonAsync("compile.json", compileJson);
    },

    __loadFromContribJson: async function() {
      // read libraries array from contrib.json
      let contrib_json_path = process.cwd() + "/contrib.json";
      let data = fs.existsSync(contrib_json_path) ? JSON.parse(fs.readFileSync(contrib_json_path, "utf-8")) : {libraries : []};
      for (let i = 0; i < data.libraries.length; i++) {
        await this.__download(data.libraries[i].repo_name, data.libraries[i].repo_tag);
      }
    },

    /**
     * Downloads a release
     * @param {String} repoName
     * @param {String} tagName
     * @return {Object} A map containing {release_data, download_path}
     */
    __download: async function(repoName, tagName) {
      // get release data
      let repo_data = this.getCache().repos.data[repoName];
      let release_data = repo_data.releases.data[tagName];
      if (!release_data) {
        throw new qx.tool.cli.Utils.UserError(`'${repoName}' has no release '${tagName}'.`);
      }
      if (!this.argv.quiet) {
        console.info(`Installing ${repoName} ${tagName}`);
      }
      // download zip of release
      let url = release_data.zip_url;
      let contrib_dir = [process.cwd(), "contrib", repoName.replace(/\//g, "_")+"_"+tagName];
      let download_path = contrib_dir.reduce((prev, current) => {
        let dir = prev + path.sep + current;
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        return dir;
      });
      if (this.argv.verbose) {
        console.info(`>>> Downloading ZIP from ${url} to ${download_path}`);
      }
      try {
        await download(url, download_path, {extract:true,
          strip: 1});
      } catch (e) {
        throw e;
      }
      return {release_data, download_path};
    }
  }
});
