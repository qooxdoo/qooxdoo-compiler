qx.Class.define("classIssue524", {
  members :  {
    main : function() {
      qx.Class.patch(qx.ui.core.Widget, qx.Mixin.define("MInsets", {
        members: {
            getInsets: function() {
            }
          }
        })
      );
    }
  }
});
