(function() {
    "use strict";

    var fs       = require('fs'),
        Concat   = require("concat-with-sourcemaps");

    var domainManager;

    function concatenateProject(files, concatFilePath) {
		var concatObj = new Concat(false, concatFilePath, '\n');
		for(var i = 0; i < files.length; i++) {
			var tmpData;
			try {
				tmpData = fs.readFileSync(files[i]).toString();
			} catch (err) {
				//Do nothing
			}
			concatObj.add(files[i], tmpData);
		}
		fs.writeFileSync(concatFilePath, concatObj.content)
		domainManager.emitEvent("concatFiles", "statusUpdate", concatFilePath);
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
                name: "concatFilePath",
                type: "string",
                description: "Where to save concatenated file"
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