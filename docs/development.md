# Development

If you want to hack on the compiler to make it better, please don't hesitate!

Fork the repo on GitHub and then clone a copy to work with it
 
```bash
git clone https://github.com/<your-user-name>/qooxdoo-compiler
cd qooxdoo-compiler
npm install
npm link # this will make this compiler the global one
```

Before submitting a Pull Request, make sure that everything works by running the
test suite with `npm test`. Any PR providing new functionality must contain a 
test in `test/bats`. Please refer to https://github.com/bats-core/bats-core on
how to write the tests.
 
