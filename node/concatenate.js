(function() {
    "use strict";

    var fs       = require('fs'),
	    path     = require('path'),
        Concat   = require("concat-with-sourcemaps");

    var domainManager;

    function concatenateProject(files, mainPath, customPath) {
        if (customPath) {
            mainPath = path.resolve(mainPath, customPath);
        }
		var concatObj = new Concat(false, mainPath, '\n');
		for(var i = 0; i < files.length; i++) {
			var tmpData;
			try {
				tmpData = fs.readFileSync(files[i]).toString();
			} catch (err) {
				//Do nothing
			}
			concatObj.add(files[i], tmpData);
		}
		fs.writeFileSync(mainPath, concatObj.content)
		domainManager.emitEvent("concatFiles", "statusUpdate", mainPath);
    }

    function init(domainManagerPassed) {
        domainManager = domainManagerPassed;
        if (!domainManager.hasDomain("concatFiles")) {
            domainManager.registerDomain("concatFiles", {
                major: 0,
                minor: 1
            });
        }
        domainManager.registerCommand("concatFiles",
            "goConcatProject",
            concatenateProject,
            false,
            "Concatenates project files", [{
                name: "files",
                type: "object",
                description: "Files to concatenate"
            }, {
                name: "mainPath",
                type: "string",
                description: "Where to save concatenated file"
            }, {
                name: "customPath",
                type: "string",
                description: "Custom path where to save concatenated file"
            }]);
        domainManager.registerEvent("concatFiles",
            "statusUpdate",
            [{
                name: "returnText",
                type: "string",
                description: "Text returned"
            }]);
    }

    exports.init = init;
}());