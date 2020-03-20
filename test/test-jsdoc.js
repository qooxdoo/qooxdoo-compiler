var test = require("tape");
require("../index");

test("Check inline markdown", assert => {
	let text = `
* *strong*
* __emphasis__
* @light@              -> <code>light</code> 
* @light@  @light@            -> <code>light</code> <code>light</code>
* {@link Resource}     -> link?
* @ignore(qx.*)
`  
  var test = qx.tool.compiler.jsdoc.Parser.parseComment(text);
  console.log(test["@description"][0].body);
  assert.end();
});

test("test ignore", assert => {
let text = `
  /* 
 @ignore(process.*)
 @ignore(global.*)
 @ignore(Symbol.*)
 @ignore(chrome.*)
 
*/ 
`
var test = qx.tool.compiler.jsdoc.Parser.parseComment(text);
console.log(test["@description"][0].body);
assert.end();

})

test("Check markdown", assert => {
	let text = `
*
* The @qx.bom.rest@ package consists of only one class: {@link Resource}.
*
* {@link Resource} allows to encapsulate the specifics of a REST interface.
* Rather than requesting URLs with a specific HTTP method manually, a resource
* representing the remote resource is instantiated and actions are invoked on this resource.
* A resource with its actions can be configured declaratively or programmatically.
*
* There is also {@link qx.io.rest.Resource} which uses {@link Resource} under the hood.
* The main differences between them are:
*
* * The event object available in the listeners (e.g. @success()@, @getSuccess()@ and @getError()@) is
*   a native JavaScript object instead of a qooxdoo object ({@link qx.event.type.Rest}):
* ** See {@link qx.io.rest.Resource} vs. {@link Resource}
* ** @event.getId()@ => @event.id@
* ** @event.getRequest()@ => @event.request@
* ** @event.getAction()@ => @event.action@
* ** @event.getData()@ => @event.response@
* ** @event.getPhase()@ => @---@ (see below)
* * Methods which allow request manipulation (e.g. @configureRequest()@) will operate on an
*   instance of {@link qx.bom.request.SimpleXhr} instead of {@link qx.io.request.Xhr}
*   (their API is similar but not identical)
* * The method @poll()@ returns no {@link qx.event.Timer} object. There are two new methods
*   (@stopPollByAction()@ and @restartPollByAction()@) available at {@link Resource}
*   which replace the functionality provided by the Timer object.
* * The phase support, which is a more elaborate version of readyState, is not available.
*   So use readyState instead.
* ** Phases (available only in {@link qx.io.rest.Resource}):
* *** @unsent@, @opened@, @sent@, @loading@, @load@, @success@
* *** @abort@, @timeout@, @statusError@
* ** readyState (available in {@link Resource} and {@link qx.io.rest.Resource}):
* *** @UNSENT@
* *** @OPENED@
* *** @HEADERS_RECEIVED@
* *** @LOADING@
* *** @DONE@  
    `;
  var test = qx.tool.compiler.jsdoc.Parser.parseComment(text);
  console.log(test["@description"][0].body);
  assert.end();
});

test("Check inline code", assert => {
	let text = `
  * // Start a 5-second recurrent timer.
  * @require(qx.event.type.Pointer) TEST // load-time dependency for early native events
  `;
  var test = qx.tool.compiler.jsdoc.Parser.parseComment(text);
  console.log(test["@description"][0].body);
  console.log(test["@require"][0].body);
  console.log(test["@require"][0].docComment);
  assert.end();
});


test("Checks jsdoc @param parser", assert => {
  var parser = new qx.tool.compiler.jsdoc.ParamParser();
  var pdoc = { name: "@param", body: "value {Boolean}, the new value of the widget" };
  parser.parseCommand(pdoc, "abc.def.Ghi", null);
  delete pdoc.name;
  delete pdoc.body;
  assert.deepEqual(pdoc, {
    "paramName": "value",
    "type": "Boolean",
    "description": ", the new value of the widget"
  });

  pdoc = { name: "@param", body: "cellInfo {Map}\nInformation about the cell being renderered, including:\n<ul>\n<li>state</li>\n<li>rowDiv</li>\n<li>stylesheet</li>\n<li>element</li>\n<li>dataIndex</li>\n<li>cellData</li>\n<li>height</li>\n</ul>" };
  parser.parseCommand(pdoc, "abc.def.Ghi", null);
  delete pdoc.name;
  delete pdoc.body;
  assert.deepEqual(pdoc, {
    "paramName": "cellInfo",
    "type": "Map",
    "description": "\nInformation about the cell being renderered, including:\n<ul>\n<li>state</li>\n<li>rowDiv</li>\n<li>stylesheet</li>\n<li>element</li>\n<li>dataIndex</li>\n<li>cellData</li>\n<li>height</li>\n</ul>"
  });

  assert.end();
});

