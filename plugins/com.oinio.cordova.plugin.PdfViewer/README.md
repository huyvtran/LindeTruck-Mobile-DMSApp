Cordova Plugin for PDF Viewer
============================

### Plugin's Purpose
This plugin is aimed to provide the simplest ways to to open and view PDF files (online & local) on iOS and Android platforms.

## Overview
1. [Supported Platforms](#supported-platforms)
2. [Installation](#installation)
3. [Using the plugin](#using-the-plugin)
4. [Known issues](#known-issues)

## Supported Platforms ##
* iOS 9+ (Not ready)
* Android 5+

## Installation ##

```bash
# ~~ from master branch ~~
cordova plugin add https://github.com/ITBconsult/cordova-plugin-pdf-viewer.git
```

## Using the plugin ##

```javascript
// Open PDF viewer with either local / online URL, e.g. 'file:///...'
window.openPDF(pdfFileUrl);
```

## iOS ##

Instead of providing rich features for viewing PDF files, this plugin would simply open PDF files via InAppBrowser cordova plugin (https://cordova.apache.org/docs/en/3.0.0/cordova/inappbrowser/inappbrowser.html). This would be provided soon, before that, please install InAppBrowser manually and use window.open(pdfFileUrl) to view the PDF file.

## Android ##

The plugin uses external PDF viewers on Android device to view PDF files. It currently only supports open local PDF files. We would provide online PDF file support later.
 
## TODO ##

- Add InAppBrowser dependency and delegate function to it on iOS.
- Add online PDF file support on Android.

## Change Log ##

### v1.1
- Support Android version 7 and later and be compatible with original versions (API <23).

## Credits ##

based on https://github.com/sitewaerts/cordova-plugin-document-viewer/

based on https://github.com/cyberkatze/pdfViewer
