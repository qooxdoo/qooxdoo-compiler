$(function() {

  var db;

  function show(name, $list) {
    var def = db.classInfo[name];
    if (!def || !def.requiredBy)
      return;
    for ( var depName in def.requiredBy) {
      var $li = $("<li>").text(depName).attr("data-classname", depName);
      if (def.requiredBy[depName].load)
        $li.addClass("load");
      else
        $li.addClass("runtime");
      $li.click(function(e) {
        e.stopPropagation();
        var $this = $(this), className = $this.attr("data-classname"), $ul = $("ul", this);
        if ($ul.length) {
          $ul.remove();
          return;
        }
        var $ul = $("<ul>");
        $this.append($ul);
        show(className, $ul);
        updateDisplay();
      });
      $list.append($li);
    }
  }

  function selectClass(name) {
    $("#root").append($("<h3>").text(name + " Required By"));
    var $root = $("<ul>");
    $("#root").append($root);
    show(name, $root);
  }

  function updateDisplay() {
    var value = $("#show").val();
    switch (value) {
    case "runtime":
      $(".load").hide();
      $(".runtime").show();
      break;

    case "load":
      $(".load").show();
      $(".runtime").hide();
      break;

    default:
      $(".load").show();
      $(".runtime").show();
      break;
    }
  }

  $.qxcli.get($.qxcli.query.targetDir + "/db.json").then(function(tmp) {
    db = tmp;
    
    for ( var name in db.classInfo) {
      var def = db.classInfo[name];
      if (def.dependsOn)
        for ( var depName in def.dependsOn) {
          var depDef = db.classInfo[depName];
          if (!depDef.requiredBy)
            depDef.requiredBy = {};
          depDef.requiredBy[name] = {
            load: def.dependsOn[depName].load
          };
        }
      selectClass(name);
    }
    
    $("#show").change(updateDisplay);
  });
  
});
