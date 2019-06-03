# Getting started

## Installation

Please refer to the [qooxdoo documentation](https://oetiker.github.io/qooxdoo-docs/#/?id=setup)
on how to install the compiler. We assume you use a globally installed `qx` executable
here.

## Example command line usage
```bash
qx create myapp -I # creates the foo application skeleton non-interactively
cd myapp

# (optional) install contrib libraries
# you can skip
qx package update # updates the local cache with information on available contribs 
qx pkg list # lists contribs compatible with myapp's qooxdoo version, determine installation candidate

qx pkg install johnspackman/UploadMgr # install UploadMgr contrib library 

# compile the application, using the compile.json default configuration values 
qx compile
```

Although many applications will run perfectly well when loaded via a `file://`
URL, browser security means that some applications *must* use an `http://` url
and to support this the CLI includes a mini web server which works with the
continuous compilation.

See [docs/cli/serve](docs/cli/serve) for more details, but as an example this is
all you need to constantly compile your application and start the web server:

```
$ qx serve
```



## Demo Browser
The Demo Browser is compiled by running demos/js/compile-demo-browser.js - it will create the Demo Browser in testdata/demobrowser/

