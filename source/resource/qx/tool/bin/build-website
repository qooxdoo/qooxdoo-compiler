#!/usr/bin/env node
require("../../../../../index");

const website = new qx.tool.utils.Website();

(async () => {
  try {
    await website.generateSite();
    await website.compileScss();
  } catch (e) {
    console.error(e);
  }
})();
