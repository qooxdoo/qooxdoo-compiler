#!/usr/bin/env bash
set -x
set -e
NODE_OPTS="--no-warnings"

npm link

echo "Testing qooxdoo-compiler version $(./qx --version)"
echo

./qx package update
./qx package install
./qx lint

# node API tests
pushd test/unittest
node $NODE_OPTS test-compiler.js
node $NODE_OPTS test-deps.js
node $NODE_OPTS test-config-schemas.js
node $NODE_OPTS test-pkg-migrate.js
node $NODE_OPTS test-commands.js
node $NODE_OPTS test-rotate-unique.js
popd

node bin/qx test --target=build --output-path-prefix=tmp

echo "CLI Tests finished successfully"