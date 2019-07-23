var test = require("tape");
var fs = require("fs");
var async = require("async");
const {promisify} = require("util");
const readFile = promisify(fs.readFile);
require("../index");

async function createMaker() {
  var QOOXDOO_PATH = "../node_modules/@qooxdoo/framework";

  // Makers use an Analyser to figure out what the Target should write
  var maker = new qx.tool.compiler.makers.AppMaker().set({
    // Targets know how to output an application
    target: new qx.tool.compiler.targets.SourceTarget("unit-tests-output").set({
      writeCompileInfo: true,
      environment: {
        envVar1: "ONE",
        envVar2: "TWO",
        "test.overridden4": "target",
        "test.overridden5": "target"
      }
    }),
    locales: ["en"],
    writeAllTranslations: true,
    environment: {
      envVar1: "one",
      envVar2: "two",
      envVar3: "three",
      envVar4: "four",
      "test.isFalse": false,
      "test.isTrue": true,
      "test.someValue": "some",
      "test.appValue": false,
      "test.overridden1": false,
      "test.overridden2": true,
      "test.overridden3": "global",
      "test.overridden4": "global",
      "test.overridden5": "global"
    }
  });
  maker.addApplication(new qx.tool.compiler.app.Application("testapp.Application").set({
    theme: "qx.theme.Indigo",
    name: "appone",
    environment: {
      envVar2: "222",
      envVar3: "333",
      "test.appValue": true,
      "qx.promise": true,
      "test.overridden1": true,
      "test.overridden2": false,
      "test.overridden5": "application"
    },
    templatePath: "../source/resource/qx/tool/cli/templates"
  }));
  
  let analyser = maker.getAnalyser();
  analyser.addLibrary(await qx.tool.compiler.app.Library.createLibrary("testapp"));
  analyser.addLibrary(await qx.tool.compiler.app.Library.createLibrary(QOOXDOO_PATH));
  
  return maker;
}

test("Checks dependencies and environment settings", assert => {
  function readJson(filename) {
    return readFile(filename, {encoding: "utf8"})
        .then(str => JSON.parse(str));
  }

  function readCompileInfo() {
    return readJson("unit-tests-output/appone/compile-info.json");
  }

  function readDbJson() {
    return readJson("unit-tests-output/db.json");
  }

  function hasClassDependency(compileInfo, classname) {
    return compileInfo.Parts.some(part => part.classes.indexOf(classname) > -1);
  }

  function hasPackageDependency(compileInfo, packageName) {
    return compileInfo.Parts.some(part => part.classes.some(classname => classname.indexOf(packageName) == 0));
  }

  var maker;
  var app;
  var compileInfo;
  var db;
  var meta;
  deleteRecursive("unit-tests-output")
      .then(() => createMaker())
      .then(_maker => {
        maker = _maker;
        app = maker.getApplications()[0];
        return maker.make()
          .then(() => {
            if (app.getFatalCompileErrors()) {
              app.getFatalCompileErrors().forEach(classname => {
                console.log("Fatal errors in class " + classname);
              });
              throw new Error("Fatal errors in application");
            }
          });
      })
      .then(() => readCompileInfo().then(tmp => compileInfo = tmp))
      .then(() => {
        // qx.util.format.DateFormat is included manually later on, so this needs to be not included automatically now
        assert.ok(!hasClassDependency(compileInfo, "qx.util.format.DateFormat"), "qx.util.format.DateFormat is automatically included");
      })

      /*
       * Test manual include and exclude
       */
      .then(() => {
        app.setExclude(["qx.ui.layout.*"]);
        app.setInclude(["qx.util.format.DateFormat"]);
        return maker.make();
      })
      .then(() => readCompileInfo().then(tmp => compileInfo = tmp))
      .then(() => {
        assert.ok(!hasPackageDependency(compileInfo, "qx.ui.layout"), "qx.ui.layout.* was not excluded");
        assert.ok(hasClassDependency(compileInfo, "qx.util.format.DateFormat"), "qx.util.format.DateFormat is not included");
      })
      // Undo the exclude/include
      .then(() => {
        app.setExclude([]);
        app.setInclude([]);
        return maker.make();
      })
      .then(() => readCompileInfo().then(tmp => compileInfo = tmp))
      .then(() => readDbJson().then(tmp => db = tmp))
      .then(() => readJson("unit-tests-output/transpiled/testapp/Application.json").then(tmp => meta = tmp))

      /*
       * Test class references in the property definition, eg annotation
       */
      .then(() => {
        var ci = db.classInfo["testapp.Application"];
        assert.ok(Boolean(ci.dependsOn["testapp.anno.MyAnno"]), "missing dependency on testapp.anno.MyAnno");
        assert.ok(Boolean(ci.dependsOn["testapp.anno.MyAnno"].load), "dependency on testapp.anno.MyAnno is not a load dependency");
      })

      /*
       * Test meta generation
       */
      .then(() => {
        assert.equal(meta.className, "testapp.Application");
        assert.equal(meta.packageName, "testapp");
        assert.equal(meta.name, "Application");
        assert.equal(meta.superClass, "qx.application.Standalone");
      })

      /*
       * Test unresolved symbols
       */
      .then(() => {
        var ci = db.classInfo["testapp.Issue488"];
        var arr = ci.unresolved.map(entry => entry.name);
        var map = {};
        arr.forEach(name => map[name] = 1);
        assert.ok(Boolean(map["abc"]), "missing unresolved abc in testapp.Issue488");
        assert.ok(Boolean(map["request"]), "missing unresolved request in testapp.Issue488");
        assert.ok(Boolean(map["ro"]), "missing unresolved to in testapp.Issue488");
        assert.ok(Boolean(map["require"]), "missing unresolved require in testapp.Issue488");
        assert.ok(Boolean(map["dontKnow"]), "missing unresolved dontKnow in testapp.Issue488");
        assert.ok(Boolean(map["c"]), "missing unresolved dontKnow in testapp.Issue488");
        assert.ok(arr.length === 6, "unexpected unresolved " + JSON.stringify(arr) + " in testapp.Issue488");
      })
      
      /*
       * Test Issue500
       */
      .then(() => readFile("unit-tests-output/transpiled/testapp/Issue500.js", "utf8")
      .then(src => {
        assert.ok(src.match(/Unable to launch monitor/), "Template Literals");
        assert.ok(src.match(/abcdef/), "Template Literals", "Ordinary Literals");
      }))
      

      /*
       * Test environment settings
       */
      .then(() => readFile("unit-tests-output/transpiled/testapp/Application.js", "utf8")
      .then(src => {
        assert.ok(!src.match(/ELIMINATION_FAILED/), "Code elimination");
        assert.ok(src.match(/TEST_OVERRIDDEN_1/), "Overridden environment vars #1");
        assert.ok(src.match(/TEST_OVERRIDDEN_2/), "Overridden environment vars #2");
        assert.ok(src.match(/var envVar1 = "ONE"/), "environment setting for envVar1");
        assert.ok(src.match(/var envVar2 = qx.core.Environment.get\("envVar2"\)/), "environment setting for envVar2");
        assert.ok(src.match(/var envVar3 = qx.core.Environment.get\("envVar3"\)/), "environment setting for envVar3");
        assert.ok(src.match(/var envVar4 = "four"/), "environment setting for envVar4");
        assert.ok(src.match(/var envTestOverriden3 = "global"/), "environment setting for envTestOverriden3");
        assert.ok(src.match(/var envTestOverriden4 = "target"/), "environment setting for envTestOverriden4");
        assert.ok(src.match(/var envTestOverriden5 = qx.core.Environment.get\("test.overridden5"\)/), "environment setting for envTestOverriden5");
        assert.ok(src.match(/var envVarSelect3 = 0/), "environment setting for envVarSelect3");
        assert.ok(src.match(/var envVarDefault1 = "some"/), "environment setting for envVarDefault1");
        assert.ok(src.match(/var envVarDefault2 = qx.core.Environment.get("test.noValue") || "default2"/), "environment setting for envVarDefault2");
        assert.ok(src.match(/var mergeStrings = "abcdefghi";/), "merging binary expressions: mergeStrings");
        assert.ok(src.match(/var mergeStringsAndNumbers = "abc23def45ghi";/), "merging binary expressions: mergeStringsAndNumbers");
        assert.ok(src.match(/var addNumbers = 138;/), "merging binary expressions: addNumbers");
        assert.ok(src.match(/var multiplyNumbers = 2952;/), "merging binary expressions: multiplyNumbers");
        assert.ok(src.match(/qx.core.Environment.get\("qx.promise"\)/), "override default env setting");
      }))
      
      .then(() => readFile("unit-tests-output/transpiled/testapp/MMyMixin.js", "utf8")
      .then(src => {
        assert.ok(src.match(/mixedInIsTrue/), "Conditional Mixin part 1");
        assert.ok(!src.match(/mixedInIsFalse/), "Conditional Mixin part 2");
      }))
      
      .then(() => readFile("unit-tests-output/transpiled/testapp/TestThat1.js", "utf8")
      .then(src => {
        assert.ok(src.match(/testapp\.TestThat1\.prototype\.toHashCode\.base\.call\(other\)/), "Aliased this");
      }))
      
      .then(() => readFile("unit-tests-output/transpiled/testapp/TestThat2.js", "utf8")
      .then(src => {
        assert.ok(src.match(/testapp\.TestThat2\.prototype\.toHashCode\.base\.call\(other\)/), "Aliased this");
      }))

      .then(() => assert.end())
      .catch(err => assert.end(err));
});

async function deleteRecursive(name) {
  return new Promise((resolve, reject) => {
    fs.exists(name, function (exists) {
      if (!exists) {
        return resolve();
      }
      deleteRecursiveImpl(name, err => {
        if (err) {
          reject(err);
        } else {
          resolve(err);
        }
      });
      return null;
    });

    function deleteRecursiveImpl(name, cb) {
      fs.stat(name, function (err, stat) {
        if (err) {
          return cb && cb(err);
        }

        if (stat.isDirectory()) {
          fs.readdir(name, function (err, files) {
            if (err) {
              return cb && cb(err);
            }
            async.each(files,
                function (file, cb) {
                  deleteRecursiveImpl(name + "/" + file, cb);
                },
                function (err) {
                  if (err) {
                    return cb && cb(err);
                  }
                  fs.rmdir(name, cb);
                  return null;
                }
            );
            return null;
          });
        } else {
          fs.unlink(name, cb);
        }
        return null;
      });
    }
  });
}
