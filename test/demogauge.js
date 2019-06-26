const Gauge = require("gauge");

let gauge = new Gauge();

let index = 0;
function next() {
  if (index == 10)
    return;
  index++;
  
  if (index == 4 || index == 7) {
    gauge.hide();
    console.log("Hello #" + index);
    gauge.show();
    setTimeout(() => {
      gauge.show("Message #" + index,0.5);
      setTimeout(next, 600);
    }, 1000);
    return;
  }
  gauge.show("Message #" + index,0.5);
  
  setTimeout(next, 600);
}
next();