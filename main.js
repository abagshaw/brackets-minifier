/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, document, clearTimeout, setTimeout, localStorage */

define(function(require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        FileUtils = brackets.getModule("file/FileUtils"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
		ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
		Strings = require("strings");
		
	var cssAction = new NodeDomain("minifycss", ExtensionUtils.getModulePath(module, "node/minifycss"));
	var jsAction = new NodeDomain("minifyjs", ExtensionUtils.getModulePath(module, "node/minifyjs"));
	
    var language = $("#status-language").text(),
        code = "",
        result = "",
        delay,
        prefs = PreferencesManager.getExtensionPrefs("brackets-minifer");

    // Define preferences
    prefs.definePreference("on-save", "boolean", false);
	prefs.definePreference("js-compress", "boolean", true);
	prefs.definePreference("js-mangle", "boolean", true);

    // Set up indicator
    $("#status-indicators").prepend('<div id="min-status" style="text-align: right;"></div>');
    var tunnel = $("#min-status");

    function status(msg) {
        tunnel.text(msg);
    }

    function save(code, path) {
        FileSystem.getFileForPath(path).write(code, {});
    }

    function process(editor, lan) {
        var file = editor.document.file;
        if (file.name.match(new RegExp("\\.min\\." + lan))) {
            status("File already minified");
            delay = setTimeout(function() {
                status("");
            }, 1000);
        } else if (lan === "js") {
            var path = file.fullPath.replace(".js", ".min.js");
			jsAction.exec("goMinifyJS", path, editor.document.getText(), prefs.get("js-compress"), prefs.get("js-mangle"))
			.done(function (returnText) {
				status(returnText);
			}).fail(function (err) {
				status("Error Occured!");
			});
            delay = setTimeout(function() {
                status("");
            }, 1000);
        } else if (lan === "css") {
			var path = file.fullPath.replace(".css", ".min.css");
			cssAction.exec("goMinifyCSS", path, editor.document.getText())
				.done(function (returnText) {
					status(returnText);
				}).fail(function (err) {
					status("Error Occured!");
				});
            delay = setTimeout(function() {
                status("");
            }, 1000);
        } else {
            status("File type not minifiable");
            delay = setTimeout(function() {
                status("");
            }, 1000);
        }
    }

    // Function to run when the menu item is clicked
    function compile() {
        status("Minifying...");
        language = (EditorManager.getActiveEditor()).document.file.name.split('.').pop();
        if (language !== "js" && language !== "css") {
            status("File type not minifiable");
            delay = setTimeout(function() {
                status("");
            }, 3000);
            return;
        } else {
            code = "";
            var editor = EditorManager.getActiveEditor();
            if (!editor) {
                return;
            }

            process(editor, language);
        }
    }

    $(DocumentManager).on("documentSaved", function(event, doc) {
        if (prefs.get("on-save")) {
            var fExt = doc.file.name.split(".").pop();

            if (fExt === "js" || fExt === "css") {
                compile();
            } else {
                status("File type not minifiable");
            }
        }
    });

    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
    var cmd_min_id = "minifier.min";
    var cmd_auto_id = "minifier.auto";
    CommandManager.register(Strings.MINIFY, cmd_min_id, compile);
    CommandManager.register(Strings.MINIFY_ON_SAVE, cmd_auto_id, function() {
        this.setChecked(!this.getChecked());
    });

    var automaton = CommandManager.get(cmd_auto_id);

    $(automaton).on('checkedStateChange', function() {
        prefs.set("on-save", automaton.getChecked());
    });

    menu.addMenuItem(cmd_min_id, "Ctrl-M");
    menu.addMenuItem(automaton);
    menu.addMenuDivider('before', 'minifier.min');
    contextMenu.addMenuItem(cmd_min_id);

    automaton.setChecked(prefs.get("on-save"));
});