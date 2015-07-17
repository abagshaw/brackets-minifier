(function () {
    "use strict";
    
    var CleanCSS = require("clean-css");
        
    function minifyCSS(css) {
        var minified = new CleanCSS().minify(css).styles;
		return minified;
    }
    
    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("simple")) {
            domainManager.registerDomain("simple", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "minifycss",       // domain name
            "goMinifyCSS",    // command name
            minifyCSS,   // command handler function
            false,          // this command is synchronous in Node
            "Minifies CSS using Clean CSS",
            [{name: "css", // parameters
                type: "string",
                description: "CSS to be minified"}],
            [{name: "minifiedCSS", // return values
                type: "string",
                description: "Minified CSS"}]
        );
    }
    
    exports.init = init;
    
}());