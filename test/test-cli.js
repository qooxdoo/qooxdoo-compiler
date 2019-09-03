var test = require("tape");
var fs = require("fs");
var async = require("async");
const {promisify} = require("util");
const readFile = promisify(fs.readFile);
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
    let indexHtml = await readFile("issue553/compiled/source/index.html", "utf8");
    assert.ok(!!indexHtml.match(/issue553one\/boot.js/m));
  
    assert.end();
  }catch(ex) {
    assert.end(ex);
  }
});

async function runCompiler(dir, ...cmd) {
  return new qx.Promise((resolve, reject) => {
    cmd.push("--machine-readable");
    let proc = child_process.spawn("qx", cmd, {
      cwd: dir
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

