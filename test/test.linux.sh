#!/usr/bin/env bash
set -x
set -e

echo "Testing qooxdoo-compiler version $(./qx --version)"
echo

pushd test
node test-deps.js
node test-config-schemas.js
popd

./qx package update

# disabled until it is fixed
# test/test-dependency-management.sh

rm -rf myapp
# test create app
./qx create myapp -I --type server -v
pushd myapp
../qx compile -v --clean
node compiled/source/myapp/myapp.js
# test qx package list
../qx package update  -v
../qx package list    -v
../qx package list --all --short --noheaders --match=qooxdoo/
../qx package list --json --installed
# test add package
../qx package install oetiker/UploadWidget -v --release v1.0.1
../qx package install cboulanger/qx-contrib-Dialog -v
../qx package install johnspackman/UploadMgr -v
../qx package install ergobyte/qookery/qookeryace -v
../qx package install ergobyte/qookery/qookerymaps -v
../qx compile -v --clean
node compiled/source/myapp/myapp.js
../qx package list --installed --short --noheaders
# test reinstall package
../qx clean -v
../qx package install -v
../qx compile -v --clean
node compiled/source/myapp/myapp.js
../qx package list -isH
# test remove package
../qx package remove oetiker/UploadWidget -v
../qx package remove ergobyte/qookery/qookeryace -v
../qx package remove ergobyte/qookery/qookerymaps -v
../qx compile -v --clean
node compiled/source/myapp/myapp.js
../qx package list --installed --short --noheaders
# test install without manifest
../qx clean -v
../qx package install ergobyte/qookery -v
../qx compile -v --clean
node compiled/source/myapp/myapp.js
../qx package list --installed --short --noheaders
# test add class and add script
../qx add class myapp.Window --extend=qx.ui.window.Window
../qx add script ../testdata/npm/script/jszip.js --rename=zip.js
cp ../testdata/npm/application/*.js source/class/myapp
../qx lint --fix --warnAsError ||  exit $?
../qx compile -v --clean
node compiled/source/myapp/myapp.js
popd
