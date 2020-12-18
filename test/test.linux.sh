#!/usr/bin/env bash
set -x
set -e
NODE_OPTS="--no-warnings"

echo "Testing qooxdoo-compiler"
echo

# Use the node_modules compiler to compile the new compiler, into ./tmp/
npx qx compile --target=build --output-path-prefix=tmp
echo '#!/usr/bin/env node
const path=require("path");
require(path.join(__dirname, "compiled", "node", "build", "compiler"));
' > tmp/qx
chmod +x tmp/qx

# Now use the new ./tmp/ compiler to compile itself again; the output goes into the 
#  normal `compiled` directory, ready for use.
#
# Note that we compile both source and build targets; this is because some of 
#  the unit tests have to refer to the compiled code and we want to be sure that
#  it does not matter if they use source or build, just make sure it is up to date
#
./tmp/qx compile
./tmp/qx compile --target=build
./tmp/qx deploy

QX=./bin/qx

$QX package update
$QX package install
$QX lint

# node API tests
pushd test/unittest
node $NODE_OPTS test-compiler.js
node $NODE_OPTS test-deps.js
node $NODE_OPTS test-config-schemas.js
node $NODE_OPTS test-pkg-migrate.js
#node $NODE_OPTS test-commands.js
node $NODE_OPTS test-rotate-unique.js
popd

$QX test --target=build

echo "CLI Tests finished successfully"