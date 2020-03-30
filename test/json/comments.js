require("../../index");

var assert = require('assert');

var TESTS = [
	'/* hello */ {  "a": 1 }',
	'{ /* hello */ "a": 1 }',
	'{  "a": /* hello */   1 }',
	'{  "a":  1 /* hello */ }'
	];

describe("Comment parsing", function() {
	TESTS.forEach(function(test, index) {
		describe("Comment #" + (index+1), function() {
			it("Comment #" + (index+1), function() {
				var ast = qx.tool.utils.json.Parser.parse(test, { verbose: true });
				var obj = qx.tool.utils.json.Stringify.astToObject(ast);
				var out = qx.tool.utils.json.Stringify.reprint(obj, ast);
				assert.equal(out, test);
			});
		});
	});
});
