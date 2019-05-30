#!/usr/bin/env bash
set -x
set -e

echo "Testing qooxdoo-compiler version $(./qx --version)"
echo

./qx package update
./qx package install
./qx lint

# node API tests
pushd test
node test-deps.js
node test-config-schemas.js
node test-pkg-migrate.js
node test-commands.js
popd

# bats CLI tests
npx bats test/bats/

echo "CLI Tests finished successfully"
