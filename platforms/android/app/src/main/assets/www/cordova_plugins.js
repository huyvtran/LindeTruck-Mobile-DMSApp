cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "cordova.plugins.diagnostic.Diagnostic",
    "file": "plugins/cordova.plugins.diagnostic/www/android/diagnostic.js",
    "pluginId": "cordova.plugins.diagnostic",
    "clobbers": [
      "cordova.plugins.diagnostic"
    ]
  },
  {
    "id": "com.linde.scapp.SCApp",
    "file": "plugins/com.linde.scapp/www/scapp.js",
    "pluginId": "com.linde.scapp",
    "clobbers": [
      "cordova.plugins.scapp"
    ]
  },
  {
    "id": "com.oinio.cordova.plugin.PdfViewer.PdfViewer",
    "file": "plugins/com.oinio.cordova.plugin.PdfViewer/www/PdfViewer.js",
    "pluginId": "com.oinio.cordova.plugin.PdfViewer",
    "merges": [
      "openPDF"
    ]
  },
  {
    "id": "cordova-plugin-actionsheet.ActionSheet",
    "file": "plugins/cordova-plugin-actionsheet/www/ActionSheet.js",
    "pluginId": "cordova-plugin-actionsheet",
    "clobbers": [
      "window.plugins.actionsheet"
    ]
  },
  {
    "id": "cordova-plugin-app-version.AppVersionPlugin",
    "file": "plugins/cordova-plugin-app-version/www/AppVersionPlugin.js",
    "pluginId": "cordova-plugin-app-version",
    "clobbers": [
      "cordova.getAppVersion"
    ]
  },
  {
    "id": "cordova-plugin-camera.Camera",
    "file": "plugins/cordova-plugin-camera/www/CameraConstants.js",
    "pluginId": "cordova-plugin-camera",
    "clobbers": [
      "Camera"
    ]
  },
  {
    "id": "cordova-plugin-camera.CameraPopoverOptions",
    "file": "plugins/cordova-plugin-camera/www/CameraPopoverOptions.js",
    "pluginId": "cordova-plugin-camera",
    "clobbers": [
      "CameraPopoverOptions"
    ]
  },
  {
    "id": "cordova-plugin-camera.camera",
    "file": "plugins/cordova-plugin-camera/www/Camera.js",
    "pluginId": "cordova-plugin-camera",
    "clobbers": [
      "navigator.camera"
    ]
  },
  {
    "id": "cordova-plugin-camera.CameraPopoverHandle",
    "file": "plugins/cordova-plugin-camera/www/CameraPopoverHandle.js",
    "pluginId": "cordova-plugin-camera",
    "clobbers": [
      "CameraPopoverHandle"
    ]
  },
  {
    "id": "cordova-plugin-device.device",
    "file": "plugins/cordova-plugin-device/www/device.js",
    "pluginId": "cordova-plugin-device",
    "clobbers": [
      "device"
    ]
  },
  {
    "id": "cordova-plugin-dialogs.notification",
    "file": "plugins/cordova-plugin-dialogs/www/notification.js",
    "pluginId": "cordova-plugin-dialogs",
    "merges": [
      "navigator.notification"
    ]
  },
  {
    "id": "cordova-plugin-dialogs.notification_android",
    "file": "plugins/cordova-plugin-dialogs/www/android/notification.js",
    "pluginId": "cordova-plugin-dialogs",
    "merges": [
      "navigator.notification"
    ]
  },
  {
    "id": "cordova-plugin-document-viewer.SitewaertsDocumentViewer",
    "file": "plugins/cordova-plugin-document-viewer/www/sitewaertsdocumentviewer.js",
    "pluginId": "cordova-plugin-document-viewer",
    "clobbers": [
      "cordova.plugins.SitewaertsDocumentViewer",
      "SitewaertsDocumentViewer"
    ]
  },
  {
    "id": "cordova-plugin-file.DirectoryEntry",
    "file": "plugins/cordova-plugin-file/www/DirectoryEntry.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.DirectoryEntry"
    ]
  },
  {
    "id": "cordova-plugin-file.DirectoryReader",
    "file": "plugins/cordova-plugin-file/www/DirectoryReader.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.DirectoryReader"
    ]
  },
  {
    "id": "cordova-plugin-file.Entry",
    "file": "plugins/cordova-plugin-file/www/Entry.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.Entry"
    ]
  },
  {
    "id": "cordova-plugin-file.File",
    "file": "plugins/cordova-plugin-file/www/File.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.File"
    ]
  },
  {
    "id": "cordova-plugin-file.FileEntry",
    "file": "plugins/cordova-plugin-file/www/FileEntry.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.FileEntry"
    ]
  },
  {
    "id": "cordova-plugin-file.FileError",
    "file": "plugins/cordova-plugin-file/www/FileError.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.FileError"
    ]
  },
  {
    "id": "cordova-plugin-file.FileReader",
    "file": "plugins/cordova-plugin-file/www/FileReader.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.FileReader"
    ]
  },
  {
    "id": "cordova-plugin-file.FileSystem",
    "file": "plugins/cordova-plugin-file/www/FileSystem.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.FileSystem"
    ]
  },
  {
    "id": "cordova-plugin-file.FileUploadOptions",
    "file": "plugins/cordova-plugin-file/www/FileUploadOptions.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.FileUploadOptions"
    ]
  },
  {
    "id": "cordova-plugin-file.FileUploadResult",
    "file": "plugins/cordova-plugin-file/www/FileUploadResult.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.FileUploadResult"
    ]
  },
  {
    "id": "cordova-plugin-file.FileWriter",
    "file": "plugins/cordova-plugin-file/www/FileWriter.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.FileWriter"
    ]
  },
  {
    "id": "cordova-plugin-file.Flags",
    "file": "plugins/cordova-plugin-file/www/Flags.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.Flags"
    ]
  },
  {
    "id": "cordova-plugin-file.LocalFileSystem",
    "file": "plugins/cordova-plugin-file/www/LocalFileSystem.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.LocalFileSystem"
    ],
    "merges": [
      "window"
    ]
  },
  {
    "id": "cordova-plugin-file.Metadata",
    "file": "plugins/cordova-plugin-file/www/Metadata.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.Metadata"
    ]
  },
  {
    "id": "cordova-plugin-file.ProgressEvent",
    "file": "plugins/cordova-plugin-file/www/ProgressEvent.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.ProgressEvent"
    ]
  },
  {
    "id": "cordova-plugin-file.fileSystems",
    "file": "plugins/cordova-plugin-file/www/fileSystems.js",
    "pluginId": "cordova-plugin-file"
  },
  {
    "id": "cordova-plugin-file.requestFileSystem",
    "file": "plugins/cordova-plugin-file/www/requestFileSystem.js",
    "pluginId": "cordova-plugin-file",
    "clobbers": [
      "window.requestFileSystem"
    ]
  },
  {
    "id": "cordova-plugin-file.resolveLocalFileSystemURI",
    "file": "plugins/cordova-plugin-file/www/resolveLocalFileSystemURI.js",
    "pluginId": "cordova-plugin-file",
    "merges": [
      "window"
    ]
  },
  {
    "id": "cordova-plugin-file.isChrome",
    "file": "plugins/cordova-plugin-file/www/browser/isChrome.js",
    "pluginId": "cordova-plugin-file",
    "runs": true
  },
  {
    "id": "cordova-plugin-file.androidFileSystem",
    "file": "plugins/cordova-plugin-file/www/android/FileSystem.js",
    "pluginId": "cordova-plugin-file",
    "merges": [
      "FileSystem"
    ]
  },
  {
    "id": "cordova-plugin-file.fileSystems-roots",
    "file": "plugins/cordova-plugin-file/www/fileSystems-roots.js",
    "pluginId": "cordova-plugin-file",
    "runs": true
  },
  {
    "id": "cordova-plugin-file.fileSystemPaths",
    "file": "plugins/cordova-plugin-file/www/fileSystemPaths.js",
    "pluginId": "cordova-plugin-file",
    "merges": [
      "cordova"
    ],
    "runs": true
  },
  {
    "id": "cordova-plugin-inappbrowser.inappbrowser",
    "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
    "pluginId": "cordova-plugin-inappbrowser",
    "clobbers": [
      "cordova.InAppBrowser.open",
      "window.open"
    ]
  },
  {
    "id": "cordova-plugin-network-information.network",
    "file": "plugins/cordova-plugin-network-information/www/network.js",
    "pluginId": "cordova-plugin-network-information",
    "clobbers": [
      "navigator.connection",
      "navigator.network.connection"
    ]
  },
  {
    "id": "cordova-plugin-network-information.Connection",
    "file": "plugins/cordova-plugin-network-information/www/Connection.js",
    "pluginId": "cordova-plugin-network-information",
    "clobbers": [
      "Connection"
    ]
  },
  {
    "id": "cordova-plugin-splashscreen.SplashScreen",
    "file": "plugins/cordova-plugin-splashscreen/www/splashscreen.js",
    "pluginId": "cordova-plugin-splashscreen",
    "clobbers": [
      "navigator.splashscreen"
    ]
  },
  {
    "id": "cordova-plugin-statusbar.statusbar",
    "file": "plugins/cordova-plugin-statusbar/www/statusbar.js",
    "pluginId": "cordova-plugin-statusbar",
    "clobbers": [
      "window.StatusBar"
    ]
  },
  {
    "id": "cordova-plugin-x-toast.Toast",
    "file": "plugins/cordova-plugin-x-toast/www/Toast.js",
    "pluginId": "cordova-plugin-x-toast",
    "clobbers": [
      "window.plugins.toast"
    ]
  },
  {
    "id": "cordova-plugin-x-toast.tests",
    "file": "plugins/cordova-plugin-x-toast/test/tests.js",
    "pluginId": "cordova-plugin-x-toast"
  },
  {
    "id": "ionic-plugin-keyboard.keyboard",
    "file": "plugins/ionic-plugin-keyboard/www/android/keyboard.js",
    "pluginId": "ionic-plugin-keyboard",
    "clobbers": [
      "cordova.plugins.Keyboard"
    ],
    "runs": true
  },
  {
    "id": "phonegap-plugin-push.PushNotification",
    "file": "plugins/phonegap-plugin-push/www/push.js",
    "pluginId": "phonegap-plugin-push",
    "clobbers": [
      "PushNotification"
    ]
  },
  {
    "id": "cordova-plugin-whitelist.whitelist",
    "file": "plugins/cordova-plugin-whitelist/whitelist.js",
    "pluginId": "cordova-plugin-whitelist",
    "runs": true
  },
  {
    "id": "com.salesforce.plugin.oauth",
    "file": "plugins/com.salesforce/www/com.salesforce.plugin.oauth.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.plugin.network",
    "file": "plugins/com.salesforce/www/com.salesforce.plugin.network.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.plugin.sdkinfo",
    "file": "plugins/com.salesforce/www/com.salesforce.plugin.sdkinfo.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.plugin.smartstore",
    "file": "plugins/com.salesforce/www/com.salesforce.plugin.smartstore.js",
    "pluginId": "com.salesforce",
    "clobbers": [
      "navigator.smartstore"
    ]
  },
  {
    "id": "com.salesforce.plugin.smartstore.client",
    "file": "plugins/com.salesforce/www/com.salesforce.plugin.smartstore.client.js",
    "pluginId": "com.salesforce",
    "clobbers": [
      "navigator.smartstoreClient"
    ]
  },
  {
    "id": "com.salesforce.plugin.sfaccountmanager",
    "file": "plugins/com.salesforce/www/com.salesforce.plugin.sfaccountmanager.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.plugin.smartsync",
    "file": "plugins/com.salesforce/www/com.salesforce.plugin.smartsync.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.util.bootstrap",
    "file": "plugins/com.salesforce/www/com.salesforce.util.bootstrap.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.util.event",
    "file": "plugins/com.salesforce/www/com.salesforce.util.event.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.util.exec",
    "file": "plugins/com.salesforce/www/com.salesforce.util.exec.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.util.logger",
    "file": "plugins/com.salesforce/www/com.salesforce.util.logger.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.util.promiser",
    "file": "plugins/com.salesforce/www/com.salesforce.util.promiser.js",
    "pluginId": "com.salesforce"
  },
  {
    "id": "com.salesforce.util.push",
    "file": "plugins/com.salesforce/www/com.salesforce.util.push.js",
    "pluginId": "com.salesforce"
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova.plugins.diagnostic": "3.6.5",
  "com.linde.scapp": "0.11.1",
  "com.oinio.cordova.plugin.PdfViewer": "1.1.1",
  "cordova-plugin-actionsheet": "2.3.3",
  "cordova-plugin-app-version": "0.1.9",
  "cordova-plugin-camera": "2.4.1",
  "cordova-plugin-device": "1.1.7",
  "cordova-plugin-dialogs": "1.3.4",
  "cordova-plugin-document-viewer": "0.8.1",
  "cordova-plugin-file": "4.3.3",
  "cordova-plugin-inappbrowser": "1.7.2",
  "cordova-plugin-network-information": "1.3.4",
  "cordova-plugin-splashscreen": "4.1.0",
  "cordova-plugin-statusbar": "2.3.0",
  "cordova-plugin-x-toast": "2.6.0",
  "ionic-plugin-keyboard": "2.2.1",
  "phonegap-plugin-push": "1.8.4",
  "cordova-plugin-whitelist": "1.2.0",
  "com.salesforce": "6.1.0"
};
// BOTTOM OF METADATA
});