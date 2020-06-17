var test = require("tape");
require("../index");


test("Check params", assert => {
	let text = `
     @param {String} json jsdoc style
     @param json {String}   qooxdoo style
`  
  var test = qx.tool.compiler.jsdoc.Parser.parseComment(text);
  qx.tool.compiler.jsdoc.Parser.parseJsDoc(test, "test", null);
  console.log(test["@description"][0].body);
  assert.end();
});

test("Check issue 633", assert => {
  {
	  let text = `
    // [Constructor]
    `  
    var test = qx.tool.compiler.jsdoc.Parser.parseComment(text);
    console.log(test["@description"][0].body);
  }
  {
    let text = `
    /**
     * Create an editor instance
     * 
     * [Constructor]
     * 
     * @return {Object}
     */
    `  
    var test = qx.tool.compiler.jsdoc.Parser.parseComment(text);
    console.log(test["@description"][0].body);
  }
  assert.end();
});

test("Check rpc", assert => {
	let text = `
  /**
   * <p>This namespace provides an API implementing the
   * <a href="https://www.jsonrpc.org/specification">JSON Remote Procedure Call (JSON-RPC) version 2 specification</a>
   * </p>
   * <p>JSON-RPC v2 is transport-agnostic. We provide a high-level
   * API interface (qx.io.jsonrpc.Client), a transport interface
   * (qx.io.jsonrpc.transport.ITransport) and an HTTP transport implementation.
   * Other transports based on websockets or other mechanisms can be added later.
   * </p>
   * Here is an example:
   *
   * <pre class="javascript">
   * (async()=>{
   *   const client = new qx.io.jsonrpc.Client("https://domain.com/endpoint");
   *   let result;
   *   try {
   *     client.sendNotification("other_method", [1,2,3]); // notifications are "fire & forget"
   *     result = await client.sendRequest("other_method", [1,2,3]);
   *   } catch(e) {
   *     // handle exceptions
   *   }
   * })();
   * </pre>
   *
   * or using a batch:
   *
   * <pre class="javascript">
   * (async()=>{
   *   const client = new qx.io.jsonrpc.Client("https://domain.com/endpoint");
   *   const batch = new qx.io.jsonrpc.protocol.Batch()
   *     .add(new qx.io.jsonrpc.protocol.Request("method3", [1,2,3]))
   *     .addNotification("method4") // or shorthand method
   *    .addRequest("method5",["foo", "bar"]) // positional parameters
   *     .addRequest("method6", {foo:"bar"}); // named parameters
   *   let results;
   *   try {
   *     results = await client.sendBatch(batch);
   *     // results will be an array with three items, the result of the requests
   *   } catch(e) {
   *     // handle exceptions
   *   }
   * })();
   * </pre>
   *
   * The high-level Client API does not handle transport-specific issues like
   * authentication - this needs to be done in the transport layer. For example,
   * to use HTTP Bearer authentication, do this:
   * <pre class="javascript">
   * const client = new qx.io.jsonrpc.Client("https://domain.com/endpoint");
   * const auth = new qx.io.request.authentication.Bearer("TOKEN");
   * client.getTransportImpl().setAuthentication(auth);
   * client.sendRequest("method-needing-authentication", [1,2,3]);
   * </pre>
   *
   * If you need a client with a customized transport often, we recommend
   * to create a class that inherits from the client class, override
   * the methods which are needed to produce that custom behavior (such
   * as {@link qx.io.jsonrpc.transport.Http#_createTransportImpl},
   * and provide a <pre class="javascript">defer</pre> section which registers
   * the behavior for your particular class of URIs:
   *
   * <pre class="javascript">
   * defer() {
   *   qx.io.jsonrpc.Client.registerTransport(/^http/, my.custom.Transport);
   * }
   * </pre>
   *
   * The client will always use the transport that was last registered for
   * a certain endpoint pattern, i.e. from then on, all clients created
   * with urls that start with "http" will use that custom behavior.
   *
   */
  `  
  var test = qx.tool.compiler.jsdoc.Parser.parseComment(text);
  console.log(test["@description"][0].body);
  assert.end();
});

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

test("Checks jsdoc inline comments and urls", assert => {
  let result;
  
  result = qx.tool.compiler.jsdoc.Parser.parseComment(
      `
     * @ignore(abc,
     *    def,
     *    ghi)
    `);
  assert.deepEqual(result, {
    "@description": [
      {
        "name": "@description",
        "body": ""
      }
    ],
    "@ignore": [
      {
        "name": "@ignore",
        "body": "abc,\n    def,\n    ghi"
      }
    ]
  });
      
  result = qx.tool.compiler.jsdoc.Parser.parseComment(
      `
     * @ignore(abc, // abc comment
     *    def, // def comment
     *    ghi)
    `);
  assert.deepEqual(result, {
    "@description": [
      {
        "name": "@description",
        "body": ""
      }
    ],
    "@ignore": [
      {
        "name": "@ignore",
        "body": "abc,\n    def,\n    ghi"
      }
    ]
  });
  
  result = qx.tool.compiler.jsdoc.Parser.parseComment(
    ` * @ignore(stuff) // comment about ignore stuff
     * http://abc.com // comment about url
     * http://dev.com 
     * 
     `);
  assert.deepEqual(result, {
    "@description": [
      {
        "name": "@description",
        "body": ""
      }
    ],
    "@ignore": [
      {
        "name": "@ignore",
        "body": "stuff"
      }
    ]
  });
  assert.end();
});

