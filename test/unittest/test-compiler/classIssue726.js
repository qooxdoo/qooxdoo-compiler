qx.Class.define("classIssue726",
  {
    members:
    {
      test_0: function () {
        let t_0 = param0;
        console.log(t_0);
      },
      test_1: function () {
        let test = "class:1:2";
        let [t_0, t_1] = test.split(":");
        console.log(t_0, t_1);
        let [testClass, ...testName] = test.split(":");
        console.log(testClass, testName);
      },
      test_2: function (param1 = {}) {
        console.log(param1);
      },
      test_3: function ({param1, param2} = {}) {
        console.log(param1, param2);
      }
    }
  });
