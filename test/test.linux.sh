#!/usr/bin/env bash
set -x
set -e
NODE_OPTS="--no-warnings"

echo "Testing qooxdoo-compiler version $(./qx --version)"
echo

./qx package update
./qx package install
./qx lint

# node API tests
pushd test
# node $NODE_OPTS test-deps.js # fail without clear error message
node $NODE_OPTS test-config-schemas.js
node $NODE_OPTS test-pkg-migrate.js
node $NODE_OPTS test-commands.js
popd

# bats CLI tests
npx bats test/bats/

echo "CLI Tests finished successfully"
