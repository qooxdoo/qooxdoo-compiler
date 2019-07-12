qx.Class.define("testapp.Issue488", {
  extend: qx.core.Object,
  
  members: {
    api: function(method, path, options) {
      abc=1;
      return request(ro);
    }
  },
  
  statics: {
    findOrCreateSsoGroup(apos, type, data) {
      return testapp.Issue488.findSsoGroupById(apos, type, data.id)
        .then(group => {
          return testapp.Issue488.findGroup(apos, { title: data.title })
            .then(group => {
            });
        });
    }
  }
});
