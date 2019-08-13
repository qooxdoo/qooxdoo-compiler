$(function() {
  
  function get(uri) {
    return new Promise(function(resolve, reject) {
      $.ajax("/serve.api/apps.json", {
        cache: false,
        dataType: "json",
        
        error: function(jqXHR, textStatus, errorThrown) {
          reject(textStatus || errorThrown);
        },
        
        success: resolve
      });
    });
  }
  
  $.qxcli = {};
  $.qxcli.serve = {
      apps: get("/serve-api/apps")
  };
  
  $.qxcli.pages = {
    homepage: function() {
      $.qxcli.serve.apps
        .then(function(data) {
          console.log(JSON.stringify(data, null, 2));
          let $root = $("#applications");
          $root.empty();
          data.forEach(targetData => {
            $root.append($("<h2>").text((targetData.target.type == "build" ? "Build" : "Source") + " Target in " + targetData.target.outputDir));
            var $ul = $("<ul>");
            targetData.apps.forEach(function(appData) {
              var $li = $("<li>");
              var $a = $("<a>");
              $a.text(appData.title||appData.name);
              $a.attr("href", targetData.target.outputDir + appData.outputPath + "/index.html");
              $li.append($a);
              $ul.append($li);
            });
            $root.append($ul);
          });
        });
    }
  };
  
});

