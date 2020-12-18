#!/usr/bin/env node

const utils = require("./bin/tools/utils");

(async function() {
  await utils.bootstrapCompiler();
  
  process.exit(0);
  
})();

