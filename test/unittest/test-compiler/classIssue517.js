/**
 * @require(qx.Class)
 * @require(qx.ui.core.Widget)
 * @require(qx.Mixin)
 */
qx.Class.define("classIssue517", {
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
