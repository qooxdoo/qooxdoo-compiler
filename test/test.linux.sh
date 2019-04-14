#!/usr/bin/env bash
set -x
set -e

echo "Testing qooxdoo-compiler version $(./qx --version)"
echo

pushd test
node test-deps.js
popd

./qx contrib update 
bash test/bash/test-dependency-management.sh 

rm -rf myapp
# test create app
./qx create myapp -I --type server -v 
pushd myapp
../qx compile -v --clean 
node compiled/source/myapp/myapp.js 
# test ./qx contrib list
../qx contrib update  -v 
../qx contrib list    -v 
../qx contrib list --all --short --noheaders --match=qooxdoo/ 
../qx contrib list --json --installed 
# test add contrib
../qx contrib install oetiker/UploadWidget -v --release v1.0.1 
../qx contrib install cboulanger/qx-contrib-Dialog -v 
../qx contrib install johnspackman/UploadMgr -v 
../qx contrib install ergobyte/qookery/qookeryace -v 
../qx contrib install ergobyte/qookery/qookerymaps -v 
../qx compile -v --clean 
node compiled/source/myapp/myapp.js 
../qx contrib list --installed --short --noheaders
# test reinstall contrib
../qx clean 
../qx contrib install -v 
../qx compile -v --clean 
node compiled/source/myapp/myapp.js
../qx contrib list -isH
# test remove contrib
../qx contrib remove oetiker/UploadWidget -v 
../qx contrib remove ergobyte/qookery/qookeryace -v 
../qx contrib remove ergobyte/qookery/qookerymaps -v 
../qx compile -v --clean 
node compiled/source/myapp/myapp.js 
../qx contrib list --installed --short --noheaders
# test install without manifest
../qx clean 
../qx contrib install ergobyte/qookery -v 
../qx compile -v --clean 
node compiled/source/myapp/myapp.js 
../qx contrib list --installed --short --noheaders
# test add class and add script
../qx add class myapp.Window --extend=qx.ui.window.Window 
../qx add script ../testdata/npm/script/jszip.js --rename=zip.js 
cp ../testdata/npm/application/*.js source/class/myapp
../qx lint --fix --warnAsError
../qx compile -v --clean 
node compiled/source/myapp/myapp.js 
popd
