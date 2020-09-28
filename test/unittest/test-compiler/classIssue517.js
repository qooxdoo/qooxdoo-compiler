/**
 * @ignore(qx.Class)
 * @ignore(qx.ui.core.Widget)
 * @ignore(qx.Mixin)
 */
qx.Class.define("classIssue517", {
  members: {
    main: function () {
      qx.Class.patch(qx.ui.core.Widget, qx.Mixin.define("MInsets", {
        members: {
          getInsets: function () {
            return this.base(arguments);
          }
        }
      })
      );
    }
  }
});
