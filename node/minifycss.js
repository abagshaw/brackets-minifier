(function () {
    "use strict";
    var path = require('path');
	var fs = require('fs');
	var mkpath = require('mkpath');
    var CleanCSS = require("clean-css");
        
    function minifyCSS(filepath, css) {
        var minified = new CleanCSS().minify(css).styles;
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
        if (!domainManager.hasDomain("minifycss")) {
            domainManager.registerDomain("minifycss", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "minifycss",       // domain name
            "goMinifyCSS",    // command name
            minifyCSS,   // command handler function
            false,          // this command is synchronous in Node
            "Minifies CSS using Clean CSS",
            [{name: "filepath", // parameters
                type: "string",
                description: "Where to save minified CSS"},
			{name: "css", // parameters
                type: "string",
                description: "CSS to be minified"}],
            [{name: "returnText", // return values
                type: "string",
                description: "Return status of save"}]
        );
    }
    
    exports.init = init;
    
}());