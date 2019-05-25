#!/usr/bin/env bash

echo
echo "Test 1: qxl.test1, latest version"
[[ -d myapp ]] && rm -rf myapp
npx qx create myapp -I
cd myapp
../qx package install qooxdoo/qxl.test1 --verbose
LIST=$(../qx package list --short --noheaders --installed --all)
echo "$LIST"
#qooxdoo/qxl.test1              qxl.test1    qxl.test1    Test library 1    v1.2.0      v1.2.0   v1.2.0
#qooxdoo/qxl.test2/qxl.test2C   qxl.test2C   qxl.test2C   Test library 2C   v1.2.2      v1.2.2   v1.2.2
#qooxdoo/qxl.test2/qxl.test2D   qxl.test2D   qxl.test2D   Test library 2D   v1.2.2      v1.2.2   v1.2.2
COUNTLINES=$(echo "$LIST" | wc -l | tr -d ' ')
if [ "$COUNTLINES" != "3" ]; then echo "Test 1 failed"; exit 1; fi
../qx compile --feedback=false --warnAsError || exit 1
cd ..

echo
echo "Test 2: qxl.test2/qxl.test2A, latest version"
rm -rf myapp
./qx create myapp -I
cd myapp
../qx package install qooxdoo/qxl.test2/qxl.test2A --verbose
LIST=$(../qx package list --short --noheaders --installed --all)
echo "$LIST"
#qooxdoo/qxl.test2/qxl.test2A   qxl.test2A   v1.2.2   v1.2.2   v1.2.2
#qooxdoo/qxl.test2/qxl.test2B   qxl.test2B   v1.2.2   v1.2.2   v1.2.2
#qooxdoo/qxl.test2/qxl.test2C   qxl.test2C   v1.2.2   v1.2.2   v1.2.2
#qooxdoo/qxl.test2/qxl.test2D   qxl.test2D   v1.2.2   v1.2.2   v1.2.2
COUNTLINES=$(echo "$LIST" | wc -l | tr -d ' ')
if [ "$COUNTLINES" != "4" ]; then echo "Test 2 failed"; exit 1; fi
../qx compile --feedback=false --warnAsError || exit 1
cd ..

echo
echo "Test 3: qxl.test1@v1.0.2 version, then migrate and upgrade"
rm -rf myapp
./qx create myapp -I
cd myapp
../qx package install qooxdoo/qxl.test1@v1.0.2 --verbose
LIST=$(../qx package list --short --noheaders --installed --all)
echo "Before migrate/ upgrade":
echo "$LIST"

cd qx_packages/qooxdoo_qxl_test1_v1_0_2/
../../../qx pkg migrate
cd ../..
../qx compile --feedback=false --warnAsError || exit 1

../qx package upgrade
echo "After upgrade:"
LIST=$(../qx package list --short --noheaders --installed --all)
echo "$LIST"
# Will be reimplemented later when output stabilizes
#EXPECTED="\
#qooxdoo/qxl.test1                 v1.0.3   v1.0.3   v1.0.3
#qooxdoo/qxl.test2/qxl.test2C      v1.0.2   v1.0.2   v1.0.2
#qooxdoo/qxl.test2/qxl.test2D      v1.0.2   v1.0.2   v1.0.2"
#if [ "$EXPECTED" != "$LIST" ]; then echo "Installing dependencies failed"; exit 1; fi

../qx compile --feedback=false --warnAsError || exit 1
cd ..

echo
echo "Test 4: qxl.test1@b1125235c1002aadf84134c0fa52f5f037f466cd"
rm -rf myapp
./qx create myapp -I
cd myapp
../qx package install qooxdoo/qxl.test1@b1125235c1002aadf84134c0fa52f5f037f466cd --verbose
LIST=$(../qx package list --short --noheaders --installed --all)
echo "$LIST"
# Will be reimplemented later when output stabilizes
#EXPECTED="\
#qooxdoo/qxl.test1                 b1125235c1002aadf84134c0fa52f5f037f466cd   v1.0.2   v1.0.2
#qooxdoo/qxl.test2/qxl.test2C      v1.0.2                                     v1.0.2   v1.0.2
#qooxdoo/qxl.test2/qxl.test2D      v1.0.2                                     v1.0.2   v1.0.2"
#if [ "$EXPECTED" != "$LIST" ]; then echo "Installing dependencies failed"; exit 1; fi
COUNTLINES=$(echo "$LIST" | wc -l | tr -d ' ')
if [ "$COUNTLINES" != "3" ]; then echo "Test 4 failed"; exit 1; fi
../qx compile --feedback=false --warnAsError || exit 1
cd ..
rm -rf myapp
