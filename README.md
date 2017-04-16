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
- [Concatenation](#concatenation)

---
### Single File Minification
To minify a file, use the keyboard shortcut `Cmd/Ctrl+Alt+M` (this will also save the file if there are unsaved changes). You can also minify files on save by checking *Minify on Save* in the *Edit* menu.

---
### Project Minification
To minify all JS and CSS files in the current project (and subdirectories), use the keyboard shortcut `Cmd/Ctrl+Alt+A`. You can also set the whole project to be minified on save by going to *Edit -> Minifier Preferences* and selecting *Minify Project on Save*. This will minify all the JS and CSS files in the current project when saving *any file* located in the current project - not necessarily a JS or CSS file. If any file about to be minified has unsaved changes, it will be saved first.

**NOTE: To minify the whole project on save you must *also* check the *Minify on Save* option in the *Edit* menu.**

**NOTE: Files open in the *Working Files* area that are not located within the current project directory are not considered part of the current project and will not be included in project minification, affected by project minification settings or trigger project minification on save. These files can still be minified using [single file minification](#single-file-minification)**

#### Excluding Files/Directories/Filetypes
You can exclude certain directories and files by entering each directory/file on a new line in the *Directories/Files to Exclude from Project Minification* area. Excluded directories **must** include trailing slash! Excluded JS/CSS files or JS/CSS files in excluded directories will not be minified during project minification and will also be ignored during [concatenation](#concatenation).

You can also exclude all JS or CSS files from being minified by unchecking either of the *Minify JavaScript during Project Minification* or *Minify CSS during Project Minification* options in the *Minifier Preferences* panel.

NOTE: [Concatenated](#concatenation) files are always minified whether or not their specific filetype is disabled for minification as described above.

NOTE: Excluded files or files of an excluded directory/filetype can still be minified using [single file minification](#single-file-minification).

---
### Custom Save Directories
To specify custom paths to save minified files to, go to *Edit -> Minifier Preferences* and enter the desired paths for minified CSS and JS files in the spaces provided. These paths begin at the project root directory.

Leaving a path blank will set the minified files of that type to be saved in the same directory as the original non-minified file.

NOTE: Custom save directories will apply to [single file minification](#single-file-minification) (on files within the current project), [project minification](#project-minification) and concatenated files generated with the [concatenation](#concatenation) feature.

---
### Concatenation
To enable concatenation, go to *Edit -> Minifier Preferences* and enter the desired name for your concatenated CSS and/or JS file(s) in the spaces provided in the concatenation section. A blank field will disable concatenation for that type of file (i.e. leaving the name for concatenated CSS file field blank will disable CSS concatenation). Only enter the name of the file without the extension. For example, entering (`alljs` in the JS concatenated file name field will result in a `alljs.js` file and `alljs.min.js` file being created for the raw concatenated file and minified concatenated file respectively). Concatenated files will be saved in the root of the project directory or in the [custom save directory](#custom-save-directory) if one is specified for that specific file type (CSS or JS).

NOTE: Concatenation only runs during [project minification](#project-minification) and only applies to files within the current project.

NOTE: Concatenation will *ignore* files with the same name as the desired name for the output concatenation file and will also ignore files ending in `.min.js` or `.min.css` for JS and CSS concatenation respectively.

---
#### UglifyJS2 Settings
You can choose to not *mangle* and/or *compress* your JavaScript during minification with the appropriate options at the bottom of the *Minifier Project Preferences* panel. For more information about these options please refer to the [UglifyJS2 documentation](https://github.com/mishoo/UglifyJS2)

NOTE: These two options also apply to [single file minification](#single-file-minification), [project minification](#project-minification) and minified concatenated JS files generated with the [concatenation](#concatenation) feature.

---
All preferences shown in the *Minifier Project Preferences* panel will be saved in a `.brackets.json` file at the root of the current project and as such, only apply to the current project. This allows for consistent settings when collaborating on a project.
