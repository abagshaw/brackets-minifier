# Minifier for [Brackets](https://github.com/adobe/brackets)

*Minifies JavaScript and CSS files in Brackets and saves to `{filename}.min.{ext}` using UglifyJS2 (for JavaScript) and CleanCSS (for CSS).*


## Installation
1. Run Brackets
2. Select *File > Install Extension...*
3. Enter `https://github.com/abagshaw/brackets-minifier/archive/master.zip` as Extension URL.
3. Click Install to begin downloading and installing the extension.

#### Alternative Installation Method
Clone this repository into `~/Library/Application Support/Brackets/extensions/user/` and restart Brackets.

## Features
- [Single File Minification](#single-file-minification)
- [Project Minification](#project-minification)
- [Custom Save Directories](#custom-save-directories)

### Single File Minification
To minify a file, use the keyboard shortcut `Cmd/Ctrl+Alt+M` (this will also save the file if there are unsaved changes). You can also minify files on save by checking *Minify on Save* in the *Edit* menu.

### Project Minification
To minify all JS and CSS files in the current project (and subdirectories), use the keyboard shortcut `Cmd/Ctrl+Alt+A`. You can also set the whole project to be minified on save by going to *Edit -> Minifier Preferences* and selecting *Minify Project on Save*. This will minify the all JS and CSS files in the current project when saving *any file* located in the current project - not necessarily a JS or CSS file. If any file about to be minified has unsaved changes, it will be saved first.

**NOTE: To minify the whole project on save you must *also* check the *Minify on Save* option in the *Edit* menu.**

**NOTE: Files open in the *Working Files* area that are not located within the current project directory are not considered part of the current project and will not be included in project minification, affected by project minification settings or trigger project minification on save. These files can still be minified using [single file minification](#single-file-minification)**

####Excluding Files/Directories/Filetypes
You can exclude certain directories and files by entering each directory/file on a new line in the *Directories/Files to Exclude from Project Minification* area. Excluded directories must include trailing slash!

You can also exclude all JS or CSS files from being minified by unchecking either of the *Minify JavaScript during Project Minification* or *Minify CSS during Project Minification* options in the *Minifier Preferences* panel. 

NOTE: Excluded files or files of an excluded directory/filetype can still be minified using [single file minification](#single-file-minification).


### Custom Save Directories
To specify custom paths to save minified files to, go to *Edit -> Minifier Preferences* and enter the desired paths for minified CSS and JS files in the spaces provided. These paths begin at the project root directory.

Leaving a path blank will set the minified files of that type to be saved in the same directory as the original non-minified file.

NOTE: Custom save directories will apply to **both** [single file minification](#single-file-minification) (on files within the current project) and [project minification](#project-minification).

---
####UglifyJS2 Settings
You can choose to not *mangle* and/or *compress* your JavaScript during minification with the appropriate options at the bottom of the *Minifier Project Preferences* panel. For more information about these options please refer to the [UglifyJS2 documentation](https://github.com/mishoo/UglifyJS2)

NOTE: These two options also apply to **both** [single file minification](#single-file-minification) and [project minification](#project-minification).

---
All preferences shown in the *Minifier Project Preferences* panel will be saved in a `.brackets.json` file at the root of the current project and as such, only apply to the current project. This allows for consistent settings when collaborating on a project.
