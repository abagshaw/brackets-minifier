(function () {
    "use strict";
    var path = require('path');
	var fs = require('fs');
	var mkpath = require('mkpath');
    var UglifyJS = require("uglifyjs");
        
    function minifyJS(filepath, js, compress, mangle) {
        var ast = UglifyJS.parse(js);
		ast.figure_out_scope();
		ast.compute_char_frequency();
		if (compress)
			ast = ast.transform(UglifyJS.Compressor());
		if (mangle)
			ast.mangle_names();
		var minified = ast.print_to_string();
		return mkfile(filepath, minified);
    }
	function mkfile(filepath, content) {
	  mkpath(path.dirname(filepath), function (err) {
		if (err) {
		  return "Error saving file!";
		}
		fs.writeFile(filepath, content);
	  });
	  return "Minified";
	}
    
    function init(domainManager) {
        if (!domainManager.hasDomain("minifyjs")) {
            domainManager.registerDomain("minifyjs", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "minifyjs",       // domain name
            "goMinifyJS",    // command name
            minifyJS,   // command handler function
            false,          // this command is synchronous in Node
            "Minifies JS using UglifyJS2",
            [{name: "filepath", // parameters
                type: "string",
                description: "Where to save minified JS"},
			{name: "js", // parameters
                type: "string",
                description: "JS to be minified"},
			{name: "compress", // parameters
				type: "string",
				description: "True to compress"},
			{name: "mangle", // parameters
				type: "string",
				description: "True to mangle"}],
            [{name: "returnText", // return values
                type: "string",
                description: "Return status of save"}]
        );
    }
    
    exports.init = init;
    
}());