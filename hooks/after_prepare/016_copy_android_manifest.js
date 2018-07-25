#!/usr/bin/env node
/**
 * Platform prepare hook
 * Salesforce copies the AndroidManifest to an different location. This hook is to match this Salesforce change after preparing the application
 */

var fs = require('fs');
var path = require('path');

var rootdir = "";

if (process.env.CORDOVA_PLATFORMS === 'android') {

    var srcFile = path.join(rootdir, "platforms/android/app/src/main/AndroidManifest.xml");
    var destFile = path.join(rootdir, "platforms/android/app/AndroidManifest.xml");

    setTimeout(function () {

        if (fs.existsSync(srcFile)) {
            fs.createReadStream(srcFile).pipe(fs.createWriteStream(destFile));
        }
    }, 0);
}
