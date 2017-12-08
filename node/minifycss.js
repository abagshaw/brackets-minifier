(function() {
    "use strict";

    var path     = require('path'),
        fs       = require('fs'),
        mkpath   = require('mkpath'),
        CleanCSS = require("clean-css");

    var domainManager;

    function minifyCSS(currentPath, filepath, customPath, options) {
        var text;
        try {
            text = fs.readFileSync(currentPath).toString();
        } catch (err) {
            domainManager.emitEvent("minifycss", "statusUpdate", err.toString());
        }
        var minified = new CleanCSS(JSON.parse(options)).minify(text).styles;
        return mkfile(filepath, customPath, minified);
    }

    function mkfile(filepath, customPath, content) {
        if (customPath !== null) {
            filepath = path.resolve(filepath, customPath);
        }
        var err = mkpath.sync(path.dirname(filepath));
        if (err && err.code !== 'EEXIST') {
            domainManager.emitEvent("minifycss", "statusUpdate", "0");
            return;
        }
        fs.writeFile(filepath, content, function(err) {
            if (err) {
                domainManager.emitEvent("minifycss", "statusUpdate", err.toString());
            } else {
                domainManager.emitEvent("minifycss", "statusUpdate", "1");
            }
        });
    }

    function init(domainManagerPassed) {
        domainManager = domainManagerPassed;
        if (!domainManager.hasDomain("minifycss")) {
            domainManager.registerDomain("minifycss", {
                major: 0,
                minor: 1
            });
        }
        domainManager.registerCommand("minifycss",
            "goMinifyCSS",
            minifyCSS,
            false,
            "Minifies CSS using Clean CSS", [{
                name: "currentPath",
                type: "string",
                description: "Where unminified CSS currently is"
            }, {
                name: "filepath",
                type: "string",
                description: "Where to save minified CSS"
            }, {
                name: "customPath",
                type: "string",
                description: "Custom path where to save CSS"
            }, {
                name: "options",
                type: "object",
                description: "CleanCSS Options"
            }]);
        domainManager.registerEvent("minifycss",
            "statusUpdate",
            [{
                name: "returnText",
                type: "string",
                description: "Text returned"
            }]);
    }

    exports.init = init;
}());