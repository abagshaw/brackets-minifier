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

    var cssAction     = new NodeDomain("minifycss", ExtensionUtils.getModulePath(module, "node/minifycss")),
        jsAction      = new NodeDomain("minifyjs", ExtensionUtils.getModulePath(module, "node/minifyjs")),
		concatAction  = new NodeDomain("concatFiles", ExtensionUtils.getModulePath(module, "node/concatenate"));

    $("#status-indicators").prepend('<div id="min-status" style="text-align: right;"></div>');
    var tunnel = $("#min-status");

    var inAction       = false,
        wholeProject   = false,
        totalSuccess   = 0,
        totalFiles     = 0,
        actionID       = 0,
		allConcatCSS   = "",
		allConcatJS    = "",
		concatenateJS  = false,
		concatenateCSS = false,
		onConcat       = false,
		currentFiles;

    var mainProjectPath,
        excludedFolders;

    function stripSlashes(str, leaveBack) {
        if (leaveBack) {
            return str.replace(/^\//, "").replace(/^\\/, "")
        }
        return str.replace(/^\/+|\/+$/, "").replace(/^\\+|\\+$/, "");
    }

    function checkProjectComplete() {
		var addedMore = false;
        if (totalFiles === 0) {
			if (onConcat) {
				statusUpdate(Strings.PROJECT_CONCAT, 0, 1500);
                inAction = false;
			} else if (totalSuccess === 0) {
				//Check to see if we need to do some concatenation action!
				if(concatenateProject()) {
					return; //We've added the concatenated files to be processed so wait for that to finish.
				}
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
    function concatStatusUpdateCallback(event, returnText) {
        var fileLanguage = returnText.split(".").pop();
		if (fileLanguage === "js") {
			minifyJS(returnText, returnText.slice(0, -3).concat(".min.js"), null)
		} else if (fileLanguage === "css") {
			minifyCSS(returnText, returnText.slice(0, -4).concat(".min.css"), null)
		}
    }

    jsAction.on("statusUpdate", statusUpdateCallback);
    cssAction.on("statusUpdate", statusUpdateCallback);
	concatAction.on("statusUpdate", concatStatusUpdateCallback);

    function getFiles() {
        function filter(file) {
            var fullPath     = FileUtils.convertToNativePath(file.fullPath),
                fileName     = FileUtils.getBaseName(fullPath),
                fileLanguage = fileName.split(".").pop();

            if(fullPath.indexOf(mainProjectPath) !== 0) {
                return false;
            }
            if (fileName.match(new RegExp("\\.min\\." + fileLanguage)) || (fileLanguage !== "js" && fileLanguage !== "css")) {
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
	function concatenateProject() {
		var runningConcat = false;
		if(prefs.get("concat-js-filename") !== "") {
			var jsConcatFiles = [];
			var concatSavePath = FileUtils.convertToNativePath(stripSlashes(mainProjectPath).concat("/").concat(stripSlashes(prefs.get("concat-js-filename"))).concat(".js"));
			if(prefs.get("js-custom-path") !== "") {
				concatSavePath = FileUtils.convertToNativePath(stripSlashes(mainProjectPath).concat("/").concat(stripSlashes(prefs.get("js-custom-path"))).concat("/").concat(stripSlashes(prefs.get("concat-js-filename"))).concat(".js"));
			}
			for(var i = 0; i < currentFiles.length; i++) {
				if(currentFiles[i].fullPath.split('.').pop() === "js" && !currentFiles[i].fullPath.endsWith(prefs.get("concat-js-filename").concat(".js"))) {
					jsConcatFiles.push(currentFiles[i].fullPath);
				}
			}
			if (jsConcatFiles.length > 0) {
				onConcat = true;
				concatAction.exec("goConcatProject", jsConcatFiles, concatSavePath).fail(function(err) {
					console.log("Error occured during concatenation.");
					console.log(err);
				});
				totalFiles++;
				totalSuccess++;
				runningConcat = true;
			}
		}
		if(prefs.get("concat-css-filename") !== "") {
			var cssConcatFiles = [];
			var concatSavePath = FileUtils.convertToNativePath(stripSlashes(mainProjectPath).concat("/").concat(stripSlashes(prefs.get("concat-css-filename"))).concat(".css"));
			if(prefs.get("css-custom-path") !== "") {
				concatSavePath = FileUtils.convertToNativePath(stripSlashes(mainProjectPath).concat("/").concat(stripSlashes(prefs.get("css-custom-path"))).concat("/").concat(stripSlashes(prefs.get("concat-css-filename"))).concat(".css"));
			}
			for(var i = 0; i < currentFiles.length; i++) {
				if(currentFiles[i].fullPath.split('.').pop() === "css" && !currentFiles[i].fullPath.endsWith(prefs.get("concat-css-filename").concat(".css"))) {
					cssConcatFiles.push(currentFiles[i].fullPath);
				}
			}
			if (cssConcatFiles.length > 0) {
				onConcat = true;
				concatAction.exec("goConcatProject", cssConcatFiles, concatSavePath).fail(function(err) {
					console.log("Error occured during concatenation.");
					console.log(err);
				});
				totalFiles++;
				totalSuccess++;
				runningConcat = true;
			}
		}
		return runningConcat;
	}
    function minifyJS(currentPath, path, customPath) {
        jsAction.exec("goMinifyJS", currentPath, path, customPath, prefs.get("js-compress"), prefs.get("js-mangle")).fail(function(err) {
            console.log(err.toString());
            if (wholeProject) {
                totalFiles--;
                checkProjectComplete();
            } else {
                statusUpdate(Strings.GENERAL_ERROR, 2, 3000);
                inAction = false;
            }
        });
    }

    function minifyCSS(currentPath, path, customPath) {
        cssAction.exec("goMinifyCSS", currentPath, path, customPath).fail(function(err) {
            if (wholeProject) {
                totalFiles--;
                checkProjectComplete();
            } else {
                statusUpdate(Strings.GENERAL_ERROR, 2, 3000);
                inAction = false;
            }
        });
    }

    function process(lan, file) {
        var customPath = prefs.get(lan.concat("-custom-path")),
            mainPath   = FileUtils.convertToNativePath((file.fullPath).replace(".".concat(lan), ".min.".concat(lan)));

        if (customPath !== "" && mainPath.indexOf(mainProjectPath) === 0) {
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
    
    function processAfterSave(fileLanguage, currentDocument) {
        if(currentDocument === undefined) {
            process(fileLanguage, file);
            return;
        }
        if (currentDocument.isDirty) {
            FileUtils.writeText(FileSystem.getFileForPath(currentDocument.file.fullPath), currentDocument.getText(), true)
                .done(function() {
                    currentDocument.notifySaved();
                    process(fileLanguage, currentDocument.file);
                }).fail(function(err) {
                    console.log(err.toString());
                    if(wholeProject) {
                        totalFiles--;
                        checkProjectComplete();
                    } else {
                        statusUpdate(Strings.FILE_ERROR, 2, 3000);
                        inAction = false;
                    }
                });
        } else {
            process(fileLanguage, currentDocument.file);
        }
    }
    
    function compileCurrent() {
        if (inAction) {
            return;
        }
		onConcat = false;
		concatenateJS = false;
		concatenateCSS = false;
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
        }
        processAfterSave(fileLanguage, editor.document);
    }

    function compileProject() {
        if (inAction) {
            return;
        }
		onConcat = false;
        excludedFolders = prefs.get("project-exclude").split("<br>").filter(Boolean);
        mainProjectPath = FileUtils.convertToNativePath(ProjectManager.getProjectRoot().fullPath);
        inAction = true;
        wholeProject = true;
        statusUpdate(Strings.MINIFYING_PROJECT, 0, 0);
        getFiles().done(function(fileListResultPassed, other) {
			var fileListResult = [];
			currentFiles = fileListResultPassed;
			for(var i = 0; i < fileListResultPassed.length; i++) {
				if (!prefs.get("css-project-minify") && fileListResultPassed[i].fullPath.split('.').pop() === "css") {
					continue;
				}
				if (!prefs.get("js-project-minify") && fileListResultPassed[i].fullPath.split('.').pop() === "js") {
					continue;
				}
				fileListResult.push(fileListResultPassed[i]);
			}
            totalFiles = fileListResult.length;
            totalSuccess = fileListResult.length;
            if (totalFiles === 0) {
                statusUpdate(Strings.NO_FILES, 0, 1750);
				//Check to see if we need to do some concatenation action!
				if(concatenateProject()) {
					return; //We've added the concatenated files to be processed so wait for that to finish.
				}
                inAction = false;
                return;
            }
            var openDocuments = DocumentManager.getAllOpenDocuments().filter(function(currentDocument) { return currentDocument.file; });
            var openDocumentPaths = $.map(openDocuments, function (oneDoc){ return oneDoc.file.fullPath; });
            fileListResult.forEach(function(file) {
                var fileLanguage = file.fullPath.split('.').pop();				
                if (openDocumentPaths.indexOf(file.fullPath) > -1) {
                    processAfterSave(fileLanguage, openDocuments[openDocumentPaths.indexOf(file.fullPath)]);
                } else {
                    process(fileLanguage, file);
                }
            });
        }).fail(function(err) {
            console.log(err)
        });
    }
    DocumentManager.on("documentSaved", function(event, doc) {
        if (prefs.get("on-save")) {
            var editor = EditorManager.getActiveEditor();
            if (!editor) {
                inAction = false;
                return;
            }
            if (prefs.get("on-save-project") && FileUtils.convertToNativePath(editor.document.file.fullPath).indexOf(FileUtils.convertToNativePath(ProjectManager.getProjectRoot().fullPath)) === 0) {
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
    automaton.on('checkedStateChange', function() {
        prefs.set("on-save", automaton.getChecked());
    });

    menu.addMenuItem(cmd_min_id, [{ "key": "Ctrl-M" }, { "key": "Ctrl-Alt-M"}]); //Keeping existing Ctrl-M key binding for Windows users. Will be removed in future versions.
    menu.addMenuItem(cmd_min_project_id, "Ctrl-Alt-A");
    menu.addMenuItem(automaton);
    menu.addMenuItem(cmd_prefs);
    menu.addMenuDivider('before', 'minifier.min');
    contextMenu.addMenuItem(cmd_min_id);
    automaton.setChecked(prefs.get("on-save"));
});