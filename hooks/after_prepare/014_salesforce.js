#!/usr/bin/env node
/**
 * Platform prepare hook
 *
 */

var fs = require('fs');
var path = require('path');

var rootdir = "";

if (process.env.CORDOVA_PLATFORMS === 'android') {
    /**
     * only for Android
     *
     * - copy server.xml file
     *
     */
    var srcFile = path.join(rootdir, "device_hooks/android/platform/servers.xml");
    var destFile = path.join(rootdir, "platforms/android/SalesforceSDK/res/xml/servers.xml");

    setTimeout(function () {
        if (fs.existsSync('platforms/android/SalesforceSDK')) {
            if (!fs.existsSync(destFile)) {
                fs.closeSync(fs.openSync(destFile, 'w'));
            }
            fs.createReadStream(srcFile).pipe(fs.createWriteStream(destFile));
        }
    }, 0);
}
