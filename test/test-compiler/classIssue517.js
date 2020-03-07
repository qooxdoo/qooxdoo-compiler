qx.Class.define("classIssue524", {
  extend : qx.application.Standalone,
  members :  {
    main : function() {
      qx.Class.patch(qx.ui.core.Widget, qx.Mixin.define("MInsets", {
        members: {
            getInsets: function() {
              if(this.getDecorator()) {
                var decorator = qx.theme.manager.Decoration.getInstance().resolve(this.getDecorator());
                if(decorator) {
                  return this.base(arguments);
                }
              }
            }
          }
        })
      );
    }
  }
});
