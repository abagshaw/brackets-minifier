(function () {
    "use strict";
    
    var UglifyJS = require("uglifyjs");
        
    function minifyJS(js) {
        var ast = UglifyJS.parse(js);
		ast.figure_out_scope();
		ast.compute_char_frequency();
		ast = ast.transform(UglifyJS.Compressor());
		ast.mangle_names();
		var minified = ast.print_to_string();
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
            "minifyjs",       // domain name
            "goMinifyJS",    // command name
            minifyJS,   // command handler function
            false,          // this command is synchronous in Node
            "Minifies JS using Clean JS",
            [{name: "js", // parameters
                type: "string",
                description: "JS to be minified"}],
            [{name: "minifiedJS", // return values
                type: "string",
                description: "Minified JS"}]
        );
    }
    
    exports.init = init;
    
}());