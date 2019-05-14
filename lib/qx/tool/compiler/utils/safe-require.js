// handle additional dependency gracefully
module.exports = function(name) {
  try {
    return require(name);
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
      console.error("New dependencies have been added. Please execute 'npm install' to install them.");
    } else {
      console.error(e.message);
    }
    process.exit(1);
  }
}
