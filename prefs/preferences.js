define(function(require, exports, module) {
    "use strict";

    var Dialogs            = brackets.getModule("widgets/Dialogs"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        Strings            = require("strings"),
        PrefsTemplate      = require("text!prefs/preferences.html");

    var prefs    = PreferencesManager.getExtensionPrefs("brackets-minifier"),
        oldPrefs = PreferencesManager.getExtensionPrefs("brackets-minifer");

    prefs.definePreference("on-save", "boolean", false);
    prefs.definePreference("on-save-project", "boolean", false);
    prefs.definePreference("project-exclude", "string", "");
    prefs.definePreference("js-custom-path", "string", "");
    prefs.definePreference("css-custom-path", "string", "");
    prefs.definePreference("js-compress", "boolean", true);
    prefs.definePreference("js-mangle", "boolean", true);
    prefs.definePreference("js-project-minify", "boolean", true);
    prefs.definePreference("css-project-minify", "boolean", true);

    //Transfer old prefs from 1.0.4 and below - will be removed in future release
    if (oldPrefs.get("on-save") === true) {
        prefs.set("on-save", true, "user");
        oldPrefs.set("on-save", undefined);
    } else if (oldPrefs.get("on-save") === false) {
        oldPrefs.set("on-save", undefined);
    }

    function getPref(pref) {
        return prefs.get(pref);
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
        var dialogWindow, projectSave, minifyJS, minifyCSS, jsPath, cssPath, excludes, mangleJS, compressJS;
        $.valHooks.textarea = {
            get: function(elem) {
                return elem.value.replace(/\r?\n/g, "<br>");
            }
        };
        var promise = Dialogs.showModalDialogUsingTemplate(Mustache.render(PrefsTemplate, Strings)).done(function(id) {
            if (id === Dialogs.DIALOG_BTN_OK) {
                setPref("on-save-project", projectSave[0].checked, "project");
                setPref("js-project-minify", minifyJS[0].checked, "project");
                setPref("css-project-minify", minifyCSS[0].checked, "project");
                setPref("js-custom-path", $.trim(jsPath.val()), "project");
                setPref("css-custom-path", $.trim(cssPath.val()), "project");
                setPref("project-exclude", $.trim(excludes.val()), "project");
                setPref("js-mangle", mangleJS[0].checked, "project");
                setPref("js-compress", compressJS[0].checked, "project");
            }
        });

        dialogWindow = $(".minifier-preferences-dialog.instance");

        projectSave = dialogWindow.find("#minifier-save-project");
        minifyJS    = dialogWindow.find("#minifier-js-bool");
        minifyCSS   = dialogWindow.find("#minifier-css-bool");
        jsPath      = dialogWindow.find("#minifier-js-path");
        cssPath     = dialogWindow.find("#minifier-css-path");
        excludes    = dialogWindow.find("#minifier-exclude-paths");
        mangleJS    = dialogWindow.find("#minifier-manglejs");
        compressJS  = dialogWindow.find("#minifier-compressjs");

        projectSave[0].checked = !!getPref("on-save-project");
        minifyJS[0].checked    = !!getPref("js-project-minify");
        minifyCSS[0].checked   = !!getPref("css-project-minify");
        mangleJS[0].checked    = !!getPref("js-mangle");
        compressJS[0].checked  = !!getPref("js-compress");
        jsPath.val(getPref("js-custom-path"));
        cssPath.val(getPref("css-custom-path"));
        excludes.val(getPref("project-exclude").replace(/<br>/g, "\n"));

        projectSave.focus();

        return promise;
    }

    exports.showPreferencesDialog = showMinifierPreferencesDialog;
    exports.get = getPref;
    exports.set = setPref;
});