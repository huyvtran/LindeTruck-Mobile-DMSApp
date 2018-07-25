#!/usr/bin/env node
/**
 * Platform prepare hook
 *
 * @author David Hohl <david.hohl@capgemini.com>
 */

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var rootdir = "";

/**
 * only for Android
 *
 * - copy server.xml file
 *
 */
if (process.env.CORDOVA_PLATFORMS === 'android') {
    var srcFile = path.join(rootdir, "device_hooks/android/015_set_default_icon_name.sh");
    var destFile = path.join(rootdir, "hooks/after_prepare/015_set_default_icon_name.sh");

    if (fs.existsSync("platforms/android") && !fs.existsSync("hooks/after_prepare/015_set_default_icon_name.sh")) {
        setTimeout(function () {
            fs.createReadStream(srcFile).pipe(fs.createWriteStream(destFile));
            exec('chmod +x hooks/after_prepare/015_set_default_icon_name.sh', function (error, stdout, stderr) {
                console.log('Salesforce Icon hack installed');
            });
        }, 0);

    }
}
