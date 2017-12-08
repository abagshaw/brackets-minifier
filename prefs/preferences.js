define(function(require, exports, module) {
    "use strict";

    var Dialogs            = brackets.getModule("widgets/Dialogs"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        Strings            = require("strings"),
        PrefsTemplate      = require("text!prefs/preferences.html");

    var prefs = PreferencesManager.getExtensionPrefs("brackets-minifier");

    prefs.definePreference("on-save", "boolean", false);
    prefs.definePreference("on-save-project", "boolean", false);
    prefs.definePreference("project-exclude", "string", "");
    prefs.definePreference("js-custom-path", "string", "");
    prefs.definePreference("css-custom-path", "string", "");
	prefs.definePreference("concat-js-filename", "string", "");
	prefs.definePreference("concat-css-filename", "string", "");
    prefs.definePreference("js-project-minify", "boolean", true);
    prefs.definePreference("css-project-minify", "boolean", true);
    prefs.definePreference("generate-map", "boolean", false);
    prefs.definePreference("keep-license", "boolean", true);
    prefs.definePreference("uglifyjs-options", "string", "{}");
    prefs.definePreference("cleancss-options", "string", "{}");
	
    function getPref(pref, passedScope) {
        if (passedScope === "project" || passedScope === "user") {
            return prefs.get(pref, {
                location: {
                    scope: passedScope
                }
            });
        } else {
            return prefs.get(pref);
        }
    }

    function setPref(pref, value, passedScope) {
        if (passedScope === "project" || passedScope === "user") {
            prefs.set(pref, value, {
                location: {
                    scope: passedScope
                }
            });
        } else {
            prefs.set(pref, value);
        }
    }

    function showMinifierPreferencesDialog() {
        var dialogWindow, projectSave, minifyJS, minifyCSS, generateMap, keepLicense, jsPath, cssPath, excludes, concatJS, concatCSS, uglifyjsOptions, cleancssOptions;
        $.valHooks.textarea = {
            get: function(elem) {
                return elem.value.replace(/\r?\n/g, "<br>");
            }
        };
        var promise = Dialogs.showModalDialogUsingTemplate(brackets.getModule("thirdparty/mustache/mustache").render(PrefsTemplate, Strings)).done(function(id) {
            if (id === Dialogs.DIALOG_BTN_OK) {
                setPref("on-save-project", projectSave[0].checked, "project");
                setPref("js-project-minify", minifyJS[0].checked, "project");
                setPref("css-project-minify", minifyCSS[0].checked, "project");
                setPref("js-custom-path", $.trim(jsPath.val()), "project");
                setPref("css-custom-path", $.trim(cssPath.val()), "project");
                setPref("project-exclude", $.trim(excludes.val()), "project");
				setPref("concat-js-filename", $.trim(concatJS.val()), "project");
                setPref("concat-css-filename", $.trim(concatCSS.val()), "project");
                setPref("uglifyjs-options", $.trim(uglifyjsOptions.val()), "project");
                setPref("cleancss-options", $.trim(cleancssOptions.val()), "project");
            }
        });

        dialogWindow = $(".minifier-preferences-dialog.instance");

        projectSave     = dialogWindow.find("#minifier-save-project");
        minifyJS        = dialogWindow.find("#minifier-js-bool");
        minifyCSS       = dialogWindow.find("#minifier-css-bool");
        jsPath          = dialogWindow.find("#minifier-js-path");
        cssPath         = dialogWindow.find("#minifier-css-path");
        excludes        = dialogWindow.find("#minifier-exclude-paths");
		concatJS        = dialogWindow.find("#minifier-concat-js-filename");
		concatCSS       = dialogWindow.find("#minifier-concat-css-filename");
		uglifyjsOptions = dialogWindow.find("#minifier-uglifyjs-options");
		cleancssOptions = dialogWindow.find("#minifier-cleancss-options");

        projectSave[0].checked = !!getPref("on-save-project");
        minifyJS[0].checked    = !!getPref("js-project-minify");
        minifyCSS[0].checked   = !!getPref("css-project-minify");
        jsPath.val(getPref("js-custom-path"));
        cssPath.val(getPref("css-custom-path"));
		concatJS.val(getPref("concat-js-filename"));
        concatCSS.val(getPref("concat-css-filename"));
        excludes.val(getPref("project-exclude").replace(/<br>/g, "\n"));
		uglifyjsOptions.val(getPref("uglifyjs-options") ? getPref("uglifyjs-options").replace(/<br>/g, "\n") : "{}");
        cleancssOptions.val(getPref("cleancss-options") ? getPref("cleancss-options").replace(/<br>/g, "\n") : "{}");

        projectSave.focus();

        return promise;
    }

    exports.showPreferencesDialog = showMinifierPreferencesDialog;
    exports.get = getPref;
    exports.set = setPref;
});