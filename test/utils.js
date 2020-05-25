const fs = require("fs");
const async = require("async");
const child_process = require("child_process");
//var fsPromises = require("fs").promises;
// node 8 compatibility
const {promisify} = require('util');
const fsPromises = {
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
  unlink: promisify(fs.unlink)
};

async function runCompiler(dir, ...cmd) {
  let result = await runCommand(dir, "qx", "compile", "--machine-readable", ...cmd);
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
  return result;
}

async function runCommand(dir, ...args) {
  return new qx.Promise((resolve, reject) => {
    let cmd = args.shift();
    let proc = child_process.spawn(cmd, args, {
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

async function safeDelete(filename) {
  try {
    await fsPromises.unlink(filename);
  } catch(ex) {
    if (ex.code == "ENOENT")
      return;
    throw ex;
  }
}

module.exports = {
  runCompiler,
  runCommand,
  deleteRecursive,
  safeDelete,
  fsPromises
};
