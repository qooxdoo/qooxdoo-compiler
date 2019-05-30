qx.Class.define("testapp.Issue206", {
  extend: qx.core.Object,
  
  properties: {
    properties: {
      minimum: {
        refine: true,
        init: Number.MAX_VALUE * -1
      },
      maximum: {
        refine: true,
        init: Number.MAX_VALUE
      },
      value: {
        refine: true,
        init: new Date().getMonth()+1
      }
    }
  }
});
