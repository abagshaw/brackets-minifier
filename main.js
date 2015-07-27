/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, document, clearTimeout, setTimeout, localStorage */
define(function(require, exports, module) {
    "use strict";

    var CommandManager  = brackets.getModule("command/CommandManager"),
        Menus           = brackets.getModule("command/Menus"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        ProjectManager  = brackets.getModule("project/ProjectManager"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain      = brackets.getModule("utils/NodeDomain"),
        LanguageManager = brackets.getModule("language/LanguageManager"),
        prefs           = require("prefs/preferences"),
        Strings         = require("strings");

    var cssAction = new NodeDomain("minifycss", ExtensionUtils.getModulePath(module, "node/minifycss")),
        jsAction  = new NodeDomain("minifyjs", ExtensionUtils.getModulePath(module, "node/minifyjs"));

    $("#status-indicators").prepend('<div id="min-status" style="text-align: right;"></div>');
    var tunnel = $("#min-status");

    var inAction     = false,
        wholeProject = false,
        totalSuccess = 0,
        totalFiles   = 0,
        actionID     = 0;

    var mainProjectPath,
        excludedFolders;

    function stripSlashes(str, leaveBack) {
        if (leaveBack) {
            return str.replace(/^\//, "").replace(/^\\/, "")
        }
        return str.replace(/^\/+|\/+$/, "").replace(/^\\+|\\+$/, "");
    }

    function checkProjectComplete() {
        if (totalFiles === 0) {
            if (totalSuccess === 0) {
                statusUpdate(Strings.PROJECT_MINIFIED, 0, 1500);
                inAction = false;
            } else {
                statusUpdate(Strings.PROJECT_ERROR, 1, 2500);
                inAction = false;
            }
        }
    }

    function statusUpdate(text, errorLevel, length) {
        if (errorLevel === 0) {
            tunnel.css("color", "#000");
        } else if (errorLevel === 1) {
            tunnel.css("color", "#B47612");
        } else if (errorLevel === 2) {
            tunnel.css("color", "#D8000C");
        }
        if (actionID > 10) {
            actionID = 0;
        } else {
            actionID++;
        }
        tunnel.text(text);
        if (length !== 0) {
            setTimeout(function(actionIDpass) {
                if (actionIDpass === actionID) {
                    tunnel.text("");
                    tunnel.css("color", "#000");
                }
            }, length, actionID);
        }
    }

    function statusUpdateCallback(event, returnText) {
        if (!inAction) {
            console.log(returnText);
            return;
        }
        if (returnText === "0") {
            statusUpdate(Strings.FOLDER_ERROR, 1, 2500);
            inAction = false;
        } else if (returnText === "1") {
            if (!wholeProject) {
                statusUpdate(Strings.MINIFIED, 0, 1500);
                inAction = false;
            } else {
                totalFiles--;
                totalSuccess--;
                checkProjectComplete();
            }
        } else {
            console.log(returnText);
            if (!wholeProject) {
                statusUpdate(Strings.FILE_ERROR, 2, 2500);
                inAction = false;
            } else {
                totalFiles--;
                checkProjectComplete();
            }
        }
    }

    jsAction.on("statusUpdate", statusUpdateCallback);
    cssAction.on("statusUpdate", statusUpdateCallback);

    function getFiles() {
        function filter(file) {
            var fullPath     = FileUtils.convertToNativePath(file.fullPath),
                fileName     = FileUtils.getBaseName(fullPath),
                fileLanguage = fileName.split(".").pop();

            if (fileName.match(new RegExp("\\.min\\." + fileLanguage)) || (fileLanguage !== "js" && fileLanguage !== "css")) {
                return false;
            }
            if (!prefs.get("js-project-minify") && fileLanguage === "js") {
                return false;
            }
            if (!prefs.get("css-project-minify") && fileLanguage === "css") {
                return false;
            }
            for (var i = 0; i < excludedFolders.length; i++) {
                var curentExclude = FileUtils.convertToNativePath(excludedFolders[i]);
                if (stripSlashes(fullPath.replace(mainProjectPath, "")) === stripSlashes(curentExclude)) {
                    return false;
                }
                if (curentExclude.match(/\\$|\/$/) && stripSlashes(fullPath.replace(mainProjectPath, "")).indexOf(stripSlashes(curentExclude, true)) === 0) {
                    return false;
                }
            }
            return true;
        }
        return ProjectManager.getAllFiles(filter, true, true);
    }

    function minifyJS(currentPath, path, customPath) {
        jsAction.exec("goMinifyJS", currentPath, path, customPath, prefs.get("js-compress"), prefs.get("js-mangle")).fail(function(err) {
            console.log(err.toString());
            statusUpdate(Strings.GENERAL_ERROR, 2, 3000);
        });
    }

    function minifyCSS(currentPath, path, customPath) {
        cssAction.exec("goMinifyCSS", currentPath, path, customPath).fail(function(err) {
            console.log(err.toString());
            statusUpdate(Strings.GENERAL_ERROR, 2, 3000);
        });
    }

    function process(lan, file) {
        var customPath = prefs.get(lan.concat("-custom-path")),
            mainPath   = (file.fullPath).replace(".".concat(lan), ".min.".concat(lan));

        if (customPath !== "") {
            mainPath = mainProjectPath;
            customPath = FileUtils.convertToNativePath(stripSlashes(customPath).concat("/").concat(FileUtils.getBaseName(file.fullPath.replace(".".concat(lan), ".min.".concat(lan)))));
        }

        if (lan === "js") {
            minifyJS(file.fullPath, mainPath, customPath);
        } else if (lan === "css") {
            minifyCSS(file.fullPath, mainPath, customPath);
        } else {
            console.log(Strings.NOT_MINIFIABLE);
        }
    }

    function compileCurrent() {
        if (inAction) {
            return;
        }
        mainProjectPath = FileUtils.convertToNativePath(ProjectManager.getProjectRoot().fullPath);
        inAction = true;
        wholeProject = false;
        var editor = EditorManager.getActiveEditor();
        if (!editor) {
            inAction = false;
            return;
        }
        var fileLanguage = editor.document.file.name.split('.').pop();
        if (editor.document.file.name.match(new RegExp("\\.min\\." + fileLanguage))) {
            statusUpdate(Strings.ALREADY_MINIFIED, 0, 1750);
            inAction = false;
            return;
        }
        statusUpdate(Strings.MINIFYING, 0, 0);
        if (fileLanguage !== "js" && fileLanguage !== "css") {
            statusUpdate(Strings.NOT_MINIFIABLE, 0, 1750);
            inAction = false;
            return;
        } else {
            process(fileLanguage, editor.document.file);
        }
    }

    function compileProject() {
        excludedFolders = prefs.get("project-exclude").split("<br>").filter(Boolean);
        if (inAction) {
            return;
        }
        mainProjectPath = FileUtils.convertToNativePath(ProjectManager.getProjectRoot().fullPath);
        inAction = true;
        wholeProject = true;
        statusUpdate(Strings.MINIFYING_PROJECT, 0, 0);
        getFiles().done(function(fileListResult, other) {
            totalFiles = fileListResult.length;
            totalSuccess = fileListResult.length;
            if (totalFiles === 0) {
                statusUpdate(Strings.NO_FILES, 0, 1750);
                inAction = false;
                return;
            }
            fileListResult.forEach(function(file) {
                var fileLanguage = file.fullPath.split('.').pop();
                process(fileLanguage, file);
            });
        }).fail(function(err) {
            console.log(err)
        });
    }
    $(DocumentManager).on("documentSaved", function(event, doc) {
        if (prefs.get("on-save")) {
            if (prefs.get("on-save-project")) {
                compileProject();
            } else {
                var lan = doc.file.name.split(".").pop();
                if (lan === "js" || lan === "css") {
                    compileCurrent();
                } else {
                    statusUpdate(Strings.NOT_MINIFIABLE, 0, 1000);
                }
            }
        }
    });
    var menu               = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU),
        contextMenu        = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU),
        cmd_min_id         = "minifier.min",
        cmd_min_project_id = "minifier.minproject",
        cmd_auto_id        = "minifier.auto",
        cmd_prefs          = "minifier.prefs";

    CommandManager.register(Strings.MINIFY, cmd_min_id, compileCurrent);
    CommandManager.register(Strings.MINIFY_PROJECT, cmd_min_project_id, compileProject);
    CommandManager.register(Strings.MINIFY_ON_SAVE, cmd_auto_id, function() {
        this.setChecked(!this.getChecked());
    });
    CommandManager.register(Strings.MINIFIER_PREFS, cmd_prefs, prefs.showPreferencesDialog);

    var automaton = CommandManager.get(cmd_auto_id);
    $(automaton).on('checkedStateChange', function() {
        prefs.set("on-save", automaton.getChecked());
    });

    menu.addMenuItem(cmd_min_id, "Ctrl-M");
    menu.addMenuItem(cmd_min_project_id, "Ctrl-Alt-M");
    menu.addMenuItem(automaton);
    menu.addMenuItem(cmd_prefs);
    menu.addMenuDivider('before', 'minifier.min');
    contextMenu.addMenuItem(cmd_min_id);
    automaton.setChecked(prefs.get("on-save"));
});