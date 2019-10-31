#!/usr/bin/env bats

setup() {
  [[ -d test ]] && cd test
  [[ -d myapp ]] && rm -rf myapp
  npx qx create myapp -I
  cd myapp
  npx qx pkg list --all --quiet
}

teardown() {
  cd ..
  [[ -d myapp ]] && rm -rf myapp
}

@test "Install qxl.test1, latest version" {
  npx qx package install qooxdoo/qxl.test1
  run npx qx package list --short --noheaders --installed --all
  [ "$status" -eq 0 ]
  [ $(echo "$output" | wc -l | tr -d ' ') = "3" ]
  npx qx compile --feedback=false
}

@test "Install qxl.test2/qxl.test2A, latest version" {
  npx qx package install qooxdoo/qxl.test2/qxl.test2A
  run npx qx package list --short --noheaders --installed --all
  [ "$status" -eq 0 ]
  [ $(echo "$output" | wc -l | tr -d ' ') = "4" ]
  npx qx compile --feedback=false
}

@test "Install qxl.test1@release then migrate and upgrade" {
  npx qx package install qooxdoo/qxl.test1@v1.0.2
  npx qx package list --short --noheaders --installed --all
  cd qx_packages/qooxdoo_qxl_test1_v1_0_2/
  npx qx pkg migrate
  cd ../..
  npx qx compile --feedback=false
  npx qx pkg upgrade
  npx qx compile --feedback=false
}

@test "Install qxl.test1@commit" {
  npx qx package install qooxdoo/qxl.test1@b1125235c1002aadf84134c0fa52f5f037f466cd
  run npx qx package list --short --noheaders --installed --all
  [ "$status" -eq 0 ]
  [ $(echo "$output" | wc -l | tr -d ' ') = "3" ]
  npx qx compile --feedback=false
}
