#!/usr/bin/env node
require("../../../../../../index");
const fs = qx.tool.utils.Promisify.fs;
const dot = require("dot");
dot.templateSettings.strip = false;
require("jstransformer-dot");

const Metalsmith = require("metalsmith");
//const filenames = require("metalsmith-filenames");
const layouts = require("metalsmith-layouts");
const markdown = require("metalsmith-markdown");
//var permalinks = require("metalsmith-permalinks");
const sass = require("node-sass");

/**
 * Metalsmith Plugin that collates a list of pages that are to be included in the site navigation
 * into the metadata, along with their URLs.
 *
 * If the metadata has a `sites.pages`, then it is expected to be an array of URLs which indicates
 * the ordering to be applied; `sites.pages` is replaced with an array of objects, one per page,
 * that contains `url` and `title` properties.
 *
 */
function getPages(files, metalsmith, done) {
  var metadata = metalsmith.metadata();

  var pages = [];
  var order = {};
  if (metadata.site.pages) {
    metadata.site.pages.forEach((url, index) => typeof url == "string" ? order[url] = index : null);
  }
  var unorderedPages = [];

  function addPage(url, title) {
    var page = {
      url: url,
      title: title
    };
    var index = order[url];
    if (index !== undefined) {
      pages[index] = page;
    } else {
      unorderedPages.push(page);
    }
  }

  for (let filename of Object.getOwnPropertyNames(files)) {
    let file = files[filename];
    if (filename === "index.html") {
      addPage("/", file.title || "Home Page");
    } else if (file.permalink || file.navigation) {
      addPage(file.permalink || filename, file.title || "Home Page");
    }
  }

  unorderedPages.forEach(page => pages.push(page));
  metadata.site.pages = pages;

  done();
}

/**
 * Metalsmith plugin that loads partials and adding them to the metadata.partials map.  Each file
 * is added with it's filename, and if it is a .html filename is also added without the .html
 * extension.
 *
 */
async function loadPartials(files, metalsmith, done) {
  const metadata = metalsmith.metadata();
  try {
    let files = await fs.readdirAsync("./partials", "utf8");
    for (let filename of files) {
      let m = filename.match(/^(.+)\.([^.]+)$/);
      if (!m) {
        continue;
      }
      let [, name, ext] = m;
      let data = await fs.readFileAsync("partials/" + filename, "utf8");
      let fn;
      try {
        fn = dot.template(data);
      } catch (err) {
        console.log("Failed to load partial " + filename + ": " + err);
        continue;
      }
      fn.name = filename;
      metadata.partials[filename] = fn;
      if (ext === "html") {
        metadata.partials[name] = fn;
      }
    }
    done();
  } catch (err) {
    done(err);
  }
}

/**
 * Generates the site with Metalsmith
 *
 * @returns {Promise}
 */
function generateSite() {
  return new Promise((resolve, reject) => {
    Metalsmith(__dirname)
      .metadata({
        site: {
          title: "Qooxdoo Application Server",
          description: "Mini website used by \"qx serve\"",
          email: "info@qooxdoo.org",
          twitter_username: "qooxdoo",
          github_username: "qooxdoo",
          pages: ["/", "/about/"]
        },
        baseurl: "",
        url: "",
        lang: "en",
        partials: {}
      })
      .source("./src")
      .destination("./build")
      .clean(true)
      .use(loadPartials)
      .use(markdown())
      .use(getPages)
      .use(layouts({
        engine: "dot"
      }))
      .build(function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
  });
}

/**
 * Compiles SCSS into CSS
 *
 * @returns {Promise}
 */
function compileScss() {
  return new Promise((resolve, reject) => {
    sass.render({
      file: "sass/qooxdoo.scss",
      outFile: "build/qooxdoo.css"
    }, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  })
    .then(result => fs.writeFileAsync("build/qooxdoo.css", result.css, "utf8"));
}

generateSite()
  .then(compileScss);


