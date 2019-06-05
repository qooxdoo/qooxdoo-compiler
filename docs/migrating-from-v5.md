# Migrating your application from qooxdoo v5

Since the new NodeJS-based compiler works in a completely different way than the
generator used up to version 5, we cannot provide fully automated migration. In
particular, it is not possible to reuse the content of `config.json`. You will 
have to manually write a new `compile.json`, and, if you have heavily relied on
the build tool features of the generator, possibly also a new `compile.js`. We
have documented both files extensively [here](configuration/compile.md). Also, 
we provide a JSON schema of `compile.json` [here](../source/resource/qx/tool/schema)
to make it easy for you to validate the configuration data. 

Here are a few gotchas that might be useful during the migration of your app:

 - The old style compiler hints (eg #require, #asset etc) have been deprecated in
generate.py for some time now, and they are not supported in Qooxdoo-Compiler at
all. Please use the new JSDOC-syntax `@require(...)`,  `@asset(...)`.

...
