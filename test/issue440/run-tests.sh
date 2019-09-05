#!/bin/bash
eval "$(curl -q -s https://raw.githubusercontent.com/coryb/osht/master/osht.sh)"

PLAN 3

rm -rf compiled

# Javascript code error
sed -i '' '/This is an error/c\
This is an error
' source/class/issue440/Application.js
NRUNS npx qx compile


# Missing class - this is not a failure
sed -i '' '/This is an error/c\
new abc.ClassNoDef();//This is an error
' source/class/issue440/Application.js
NRUNS npx qx compile

# No errors
sed -i '' '/This is an error/c\
//This is an error
' source/class/issue440/Application.js
RUNS npx qx compile

