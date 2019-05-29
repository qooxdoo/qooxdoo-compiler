# Qooxdoo Compiler and Command Line Interface

[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/qooxdoo/qooxdoo)
[![Build Status](https://travis-ci.org/qooxdoo/qooxdoo-compiler.svg?branch=master)](https://travis-ci.org/qooxdoo/qooxdoo-compiler)

Qooxdoo-Compiler is the new compiler and command line interface for Qooxdoo (http://qooxdoo.org) applications, written in 100% Node.JS Javascript it adds these key improvements over the standard python generator:

* Includes Babel for adding ES6 to all Qooxdoo applications 
* Fast (up to 24x faster) and low resource usage (tiny cache, low CPU usage)
* Flexible and powerful command line tool for compiling and modifying applications
* Backward compatible with existing Qooxdoo apps
* Written in 100% Javascript
* API based, easily extended and with dependency information available at runtime

One of the top goals of this project is to be very fast and lightweight - fast
enough to detect code changes and recompile  applications on the fly on a
production server, with an application recompile costing a few hundreds of
milliseconds.

The included command line utility allows you create, build and manage
[qooxdoo](http://www.qooxdoo.org) applications (note that Qooxdoo-Compiler now
incorporates the Qooxdoo-CLI project, which used to be a separate repo).

## Development status

Beta. The API has mostly stabilized, we will provide a migration path for any
backward-incompatible changes.

## Prerequisites

- **Node** Currently requires NodeJS >= v8. We recommend you consider `nvm` to
ease installing and switching between node versions - you can find the Linux
version at http://nvm.sh and there is a version for Windows at
https://github.com/coreybutler/nvm-windows

- **Qooxdoo** The compiler works with all qooxdoo versions >= v6.0.0, which is 
contained in the current master branch. 
 
Install `nvm` and then:

```bash
nvm install 8 # or 10
nvm use 8 # or 10
```

## Test drive

For more detailed information about installation and use of the compiler, refer
to the [documentation](docs/readme.md). 

Here's how you can do a quick test drive using `npx` which doesn't install anything
permanent

```bash
npx qx create myapp --noninteractive
cd myapp
npx qx package install qooxdoo/qxl.apiviewer
npx qx package install qooxdoo/qxl.widgetbrowser
npx qx serve
```
Wait for the message `Web server started, please browse to http://localhost:8080`,
then open that address in the browser. 

## Frequently Asked Questions

## Is the compiler stable enough to be used in a production project?

Qooxdoo Compiler is a BETA RELEASE and of course, you use at your own risk.
However, it is in use in several major production applications maintained by the
qooxdoo core developers and therefore you can be fairly confident that we cherish
stability and every major bug that comes up will be fixed ASAP. 

### Gotchas

Number one gotcha is that you have to run the compiler every time you change
your code, because it's being transpiled. The `qx compile` command has a
`--watch` parameter that enables continuous compilation.  Note that the `qx
serve` command always used continuous compilation.

### What about config.json? QOOXDOO_PATH?

`config.json` is not used by QxCompiler; the `qx` command is using a new, and much
simpler configuration [file called `compile.json`](docs/configuration/compile.md).
The path to the qooxdoo library does not need to be specified since the compiler
comes with its own copy of the framework, if this is not what you want, you can
use the CLI to set the path:
```
qx config set qx.libraryPath /path/to/qooxdoo/framework
```

### Is Qooxdoo-Compiler a complete replacement for generate.py?

The compiler is a full equivalent as far as compiling is concerned, and much
faster at that. However, its domain is compiling applications (including
collecting resources) whereas generate.py included features for building and
running test suites, creating API documentation, building distributions,
creating skeleton applications, etc. These features have not been replicated.
Instead, you can do all these things with code now in a [file called `compile.js`](docs/configuration/compile.md#compilejs)

## Contributing and Getting In Touch

Please get stuck in to any aspects you'd like to work on - We're open to pull
requests, and you can contact us to chat about features you'd like to see or
help on using or extending Qooxdoo-Compiler.  The best place to talk about it is
on Gitter at https://gitter.im/qooxdoo/qooxdoo
