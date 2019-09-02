call npx qx --version
@echo on
@echo node API tests
cd test
call node test-deps.js           || EXIT /B 1
call node test-config-schemas.js || EXIT /B 1
call node test-pkg-migrate.js    || EXIT /B 1
call node test-commands.js       || EXIT /B 1
@echo setup
cd ..
rmdir  /Q /S myapp
@echo "test create app"
call npx qx create myapp --type server -I  -v || EXIT /B 1
cd myapp
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\myapp.js || EXIT /B 1
@echo "test add package"
call npx qx package update -v || EXIT /B 1
call npx qx package list -v || EXIT /B 1
call npx qx package install oetiker/UploadWidget -v --release v1.0.1 || EXIT /B 1
call npx qx package install cboulanger/qx-contrib-Dialog -v || EXIT /B 1
call npx qx package install johnspackman/UploadMgr -v || EXIT /B 1
call npx qx package install ergobyte/qookery/qookeryace -v || EXIT /B 1
call npx qx package install ergobyte/qookery/qookerymaps -v || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\myapp.js || EXIT /B 1
@echo "test reinstall package"
call npx qx clean
call npx qx package install  -v || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\myapp.js || EXIT /B 1
@echo test remove package
call npx qx package remove oetiker/UploadWidget -v || EXIT /B 1
call npx qx package remove ergobyte/qookery/qookeryace -v || EXIT /B 1
call npx qx package remove ergobyte/qookery/qookerymaps -v || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\myapp.js || EXIT /B 1
@echo test install without manifest
call npx qx clean
call npx qx package install ergobyte/qookery -v || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\myapp.js || EXIT /B 1
@echo test add class and add script
call npx qx add class myapp.Window --extend=qx.ui.window.Window --force || EXIT /B 1
call npx qx add script ..\test\testdata\npm\script\jszip.js --rename=zip.js || EXIT /B 1
copy ..\test\testdata\npm\application\*.js source\class\myapp /Y
call npx qx lint --fix --warnAsError || EXIT /B 1
call npx qx compile -v --clean || EXIT /B 1
call node compiled\source\myapp\myapp.js || EXIT /B 1
@echo cleanup
cd ..
rmdir  /Q /S myapp
