#!/usr/bin/env bats

# Tests do not check output yet

setup() {
  if [[ -d test ]] ; then cd test ; fi
  if [[ "$BATS_TEST_NUMBER" != "1" ]] && [[ -d myapp ]] ; then cd myapp ; fi
}

@test "Create app" {
  [[ -d myapp ]] && rm -rf myapp
  npx qx create myapp -I --type server -v
  cd myapp
  npx qx compile --clean
  node compiled/source/myapp/index.js
}

@test "qx package list" {
  npx qx package update  -v
  npx qx package list -v
  npx qx package list --all --short --noheaders --match=qooxdoo/
  npx qx package list --json --installed
  npx qx package list --uris-only
}

@test "Install packages" {
  npx qx package install oetiker/UploadWidget -v --release v1.0.1
  npx qx package install qooxdoo/qxl.dialog@v3.0.0 -v
  npx qx package install johnspackman/UploadMgr -v
  npx qx package install ergobyte/qookery/qookeryace@0.7.0-pre -v
  npx qx compile --clean
  node compiled/source/myapp/index.js
  npx qx package list --installed --short --noheaders
}

@test "Reinstall package" {
  npx qx clean -v
  npx qx package install -v
  npx qx compile --clean
  node compiled/source/myapp/index.js
  npx qx package list -isH
}

@test "Remove packages" {
  npx qx package remove oetiker/UploadWidget -v
  npx qx package remove ergobyte/qookery/qookeryace -v
  npx qx package remove ergobyte/qookery/qookerymaps -v
  npx qx compile --clean
  node compiled/source/myapp/index.js
  npx qx package list --installed --short --noheaders
}

@test "Install without manifest" {
  npx qx clean -v
  npx qx package install ergobyte/qookery -v
  npx qx compile --clean
  node compiled/source/myapp/index.js
  npx qx package list --installed --short --noheaders
}

@test "Add class and add script" {
  npx qx add class myapp.Window --extend=qx.ui.window.Window
#  npx qx add script ../testdata/npm/script/jszip.js --rename=zip.js
  cp ../testdata/npm/application/*.js source/class/myapp
  npx qx compile --clean || true
  node compiled/source/myapp/index.js
}

@test "Clean up" {
  cd ..
  rm -rf myapp
}
