#!/usr/bin/env node

const utils = require("./bin/tools/utils");
const fs = require("fs");

(async function() {
  console.log("pwd=" + process.cwd());
  let files = await fs.promises.readdir(".");
  console.log("files=" + files.join("\n  "));
  await utils.bootstrapCompiler();
  
  process.exit(0);
  
})();

