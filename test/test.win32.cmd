call npm link
@echo [101;93m check version [0m
call npx qx --version
@echo on
@echo [101;93m node API tests [0m
@cd test/unittest
call node test-compiler.js       || EXIT /B 1
call node test-deps.js           || EXIT /B 1
call node test-config-schemas.js || EXIT /B 1
call node test-pkg-migrate.js    || EXIT /B 1
call node test-commands.js       || EXIT /B 1
call node test-cli.js            || EXIT /B 1
call node test-rotate-unique.js  || EXIT /B 1
@echo [101;93m setup [0m
cd ../..

node bin/qx test --target=build --output-path-prefix=tmp
@echo [101;93m CLI Tests finished successfully [0m

