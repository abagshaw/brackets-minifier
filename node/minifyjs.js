(function() {
    "use strict";

    var path     = require('path'),
        fs       = require('fs'),
        mkpath   = require('mkpath'),
        UglifyJS = require("uglify-js");

    var domainManager;

    function minifyJS(currentPath, filepath, customPath, options) {
        var text;
        try {
            text = fs.readFileSync(currentPath).toString();
        } catch (err) {
            domainManager.emitEvent("minifyjs", "statusUpdate", err.toString());
        }
        var minified = UglifyJS.minify(text, JSON.parse(options)).code;
        return mkfile(filepath, customPath, minified);
    }

    function mkfile(filepath, customPath, content) {
        if (customPath !== null) {
            filepath = path.resolve(filepath, customPath);
        }
        var err = mkpath.sync(path.dirname(filepath));
        if (err && err.code !== 'EEXIST') {
            domainManager.emitEvent("minifyjs", "statusUpdate", "0");
            return;
        }
        fs.writeFile(filepath, content, function(err) {
            if (err) {
                domainManager.emitEvent("minifyjs", "statusUpdate", err.toString());
            } else {
                domainManager.emitEvent("minifyjs", "statusUpdate", "1");
            }
        });
    }

    function init(domainManagerPassed) {
        domainManager = domainManagerPassed;
        if (!domainManager.hasDomain("minifyjs")) {
            domainManager.registerDomain("minifyjs", {
                major: 0,
                minor: 1
            });
        }
        domainManager.registerCommand("minifyjs",
            "goMinifyJS",
            minifyJS,
            false,
            "Minifies JS using UglifyJS2", [{
                name: "currentPath",
                type: "string",
                description: "Where unminified JS currently is"
            }, {
                name: "filepath",
                type: "string",
                description: "Where to save minified JS"
            }, {
                name: "customPath",
                type: "string",
                description: "Custom path where to save JS"
            }, {
                name: "options",
                type: "object",
                description: "UglifyJS Options"
            }]);
        domainManager.registerEvent("minifyjs",
            "statusUpdate",
            [{
                name: "returnText",
                type: "string",
                description: "Text returned"
            }]);
    }

    exports.init = init;
}());