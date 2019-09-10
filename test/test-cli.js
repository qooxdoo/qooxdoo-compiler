var test = require("tape");
var fs = require("fs");
var fsPromises = require("fs").promises;
var async = require("async");
const child_process = require("child_process");
const qx = require("@qooxdoo/framework");

test("Issue553", async assert => {
  try {
    await deleteRecursive("issue553/compiled");
    let result = await runCompiler("issue553", "compile");
    let messages = result.messages.filter(msg => msg.id == "qx.tool.cli.compile.selectingDefaultApp");
    assert.ok(messages.length == 1);
    assert.ok(messages[0].args[0] === "issue553one");
    assert.ok(fs.existsSync("issue553/compiled/source/index.html"));
    let indexHtml = await fsPromises.readFile("issue553/compiled/source/index.html", "utf8");
    assert.ok(!!indexHtml.match(/issue553one\/boot.js/m));
  
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

test("Issue440", async assert => {
  try {
    await deleteRecursive("issue440/compiled");
    let code = await fsPromises.readFile("issue440/source/class/issue440/Application.js", "utf8");
    code = code.split("\n");
    let errorLine = -1;
    code.forEach((line, index) => {
      if (line.match(/This is an error/i))
        errorLine = index;
    });
    
    let result;
    
    code[errorLine] = "This is an error";
    await fsPromises.writeFile("issue440/source/class/issue440/Application.js", code.join("\n"), "utf8");
    result = await runCompiler("issue440", "compile");
    assert.ok(result.exitCode === 1);
    
    code[errorLine] = "new abc.ClassNoDef();//This is an error";
    await fsPromises.writeFile("issue440/source/class/issue440/Application.js", code.join("\n"), "utf8");
    result = await runCompiler("issue440", "compile");
    assert.ok(result.exitCode === 1);
    
    code[errorLine] = "//This is an error";
    await fsPromises.writeFile("issue440/source/class/issue440/Application.js", code.join("\n"), "utf8");
    result = await runCompiler("issue440", "compile");
    assert.ok(result.exitCode === 0);
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});
  
test("testLegalSCSS", async assert => {
  try {  
    await deleteRecursive("testLegalSCSS/compiled");
    let result = await runCompiler("testLegalSCSS", "compile");
    assert.ok(fs.existsSync("testLegalSCSS/compiled/source/resource/testLegalSCSS/css/test_css.css"));
    assert.ok(fs.existsSync("testLegalSCSS/compiled/source/resource/testLegalSCSS/css/test_scss.css"));
    assert.ok(fs.existsSync("testLegalSCSS/compiled/source/resource/testLegalSCSS/css/test_theme_scss.css"));
    assert.ok(fs.existsSync("testLegalSCSS/compiled/source/testLegalSCSS/boot.js"));
    let bootJS = await fsPromises.readFile("testLegalSCSS/compiled/source/testLegalSCSS/boot.js", "utf8");
    let pos1 = bootJS.indexOf("cssBefore");
    let pos2 = bootJS.indexOf("]", pos1 + 1);
    let test = bootJS.substring(pos1, pos2 + 1);
    assert.ok(test.indexOf("testLegalSCSS:testLegalSCSS/css/test_css.css") > 0);
    assert.ok(test.indexOf("testLegalSCSS:testLegalSCSS/css/test_scss.css") > 0);
    assert.ok(test.indexOf("testLegalSCSS:testLegalSCSS/css/test_theme_scss.css") > 0);
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

async function runCompiler(dir, ...cmd) {
  return new qx.Promise((resolve, reject) => {
    cmd.push("--machine-readable");
    let proc = child_process.spawn("qx", cmd, {
      cwd: dir,
      shell: true
    });
    let result = {
        exitCode: null,
        output: "",
        messages: null
    };
    proc.stdout.on('data', data => result.output += data);
    proc.stderr.on('data', data => result.output += data);

    proc.on('close', code => {
      result.exitCode = code;
      result.messages = [];
      result.output.split("\n").forEach(line => {
        let m = line.match(/^\#\#([^:]+):\[(.*)\]$/);
        if (m) {
          let args = m[2].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (args) {
            args = args.map(arg => {
              if (arg.length && arg[0] == "\"" && arg[arg.length - 1] == "\"")
                return arg.substring(1, arg.length - 1);
              return arg;
            });
          } else {
            args = [];
          }
          result.messages.push({
            id: m[1],
            args: args
          });
        }
      });
      resolve(result);
    });
    proc.on('error', reject);
  });
}

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

