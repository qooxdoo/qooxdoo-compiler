call npm link
@echo [101;93m check version [0m
call npx qx --version
@echo on
@echo [101;93m node API tests [0m
@cd test
call node test-utils.js          || EXIT /B 1
call node test-compiler.js       || EXIT /B 1
call node test-deps.js           || EXIT /B 1
call node test-config-schemas.js || EXIT /B 1
call node test-pkg-migrate.js    || EXIT /B 1
call node test-commands.js       || EXIT /B 1
call node test-cli.js            || EXIT /B 1
cd testTranslation
call node run-tests.js            || EXIT /B 1
cd ..

@echo [101;93m setup [0m
cd ..
rmdir  /Q /S myapp
@echo [101;93m test create app [0m
call npx qx create myapp --type server -I  -v || EXIT /B 1
cd myapp
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\index.js || EXIT /B 1
@echo [101;93m test add package [0m
call npx qx package update -v || EXIT /B 1
call npx qx package list -v || EXIT /B 1
call npx qx package install oetiker/UploadWidget -v --release v1.0.1 || EXIT /B 1
call npx qx package install cboulanger/qx-contrib-Dialog -v || EXIT /B 1
call npx qx package install johnspackman/UploadMgr -v || EXIT /B 1
call npx qx package install ergobyte/qookery/qookeryace -v || EXIT /B 1
call npx qx package install ergobyte/qookery/qookerymaps -v || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\index.js || EXIT /B 1
@echo [101;93m test reinstall package [0m
call npx qx clean
call npx qx package install  -v || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\index.js || EXIT /B 1
@echo [101;93m test remove package [0m
call npx qx package remove oetiker/UploadWidget -v || EXIT /B 1
call npx qx package remove ergobyte/qookery/qookeryace -v || EXIT /B 1
call npx qx package remove ergobyte/qookery/qookerymaps -v || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\index.js || EXIT /B 1
@echo [101;93m test install without manifest [0m
call npx qx clean
call npx qx package install ergobyte/qookery -v || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\index.js || EXIT /B 1
@echo [101;93m test add class and add script [0m
call npx qx add class myapp.Window --extend=qx.ui.window.Window --force || EXIT /B 1
call npx qx add script ..\test\testdata\npm\script\jszip.js --rename=zip.js || EXIT /B 1
copy ..\test\testdata\npm\application\*.js source\class\myapp /Y
call npx qx lint --fix --warnAsError || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\index.js || EXIT /B 1
@echo [101;93m cleanup [0m
cd ..
rmdir  /Q /S myapp
