#!/bin/bash

echo '\x1B[0;94m**********************************************************\x1B[0m'
echo '\x1B[0;94mPreparing Project for Android Development\x1B[0m'
echo '\x1B[0;94m**********************************************************\x1B[0m'

# Please configure the following three lines according to your individual setup and disable the following lines
echo '\x1B[0;91mx PLEASE SET UP YOUR ANDROID_HOME PATH\x1B[0m'
   # exit
# after setting up your ANDROID_HOME, please disable until here
export ANDROID_HOME=/Users/gw/Library/Android/sdk >/dev/null 2>/dev/null
export PATH=${PATH}:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools >/dev/null 2>/dev/null

# ANDROID_HOME
if [ ! -d $ANDROID_HOME ]; then
    echo '\x1B[0;91mx ANDROID_HOME not correctly configured. Exiting here.\x1B[0m'
    exit
else
    echo '\x1B[0;32m✓ ANDROID_HOME seems to be set correctly.\x1B[0m'
fi

# platform
if [ -d platforms ]; then
    echo '\x1B[0;33m! "platforms"-folder already exists. Trying to delete.\x1B[0m'
    rm -rf platforms >/dev/null 2>/dev/null
else
    echo '\x1B[0;32m✓ No "platforms"-folder found.\x1B[0m'
fi

# plugin
if [ -d plugins ]; then
    echo '\x1B[0;33m! "plugins"-folder already exists. Trying to delete.\x1B[0m'
    rm -rf plugins >/dev/null 2>/dev/null
else
    echo '\x1B[0;32m✓ No "plugins"-folder found.\x1B[0m'
fi

if [ -d node_modules ]; then
    echo '\x1B[0;33m! "node_modules"-folder already exists. Trying to delete.\x1B[0m'
    rm -rf node_modules >/dev/null 2>/dev/null
else
    echo '\x1B[0;32m✓ No "node_modules"-folder found.\x1B[0m'
fi

echo '\x1B[0;32m✓ Adding shelljs node module to project.\x1B[0m'
npm install shelljs@0.7.0 >/dev/null 2>/dev/null

# Node modules
echo '\x1B[0;32m✓ Installing node modules.\x1B[0m'
npm install --loglevel=silent --quiet >/dev/null 2>/dev/null

# Add new plugins here and not to ionic state, because we can exactly control order of installation from here
echo '\x1B[0;32m✓ Adding cordova plugins.\x1B[0m'

echo '\x1B[0;90m✓ Installing Device Plugin.\x1B[0m'
cordova plugin add cordova-plugin-device@1.1.7 --nofetch --nosave >/dev/null 2>/dev/null

#echo '\x1B[0;90m✓ Installing Whitelist Plugin.\x1B[0m'
#cordova plugin add cordova-plugin-whitelist@1.3.3 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Cordova-plugin-InAppBrowser\x1B[0m'
cordova plugin add cordova-plugin-inappbrowser@1.7.2 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing App Version Plugin.\x1B[0m'
cordova plugin add cordova-plugin-app-version@0.1.9 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Camera Plugin.\x1B[0m'
cordova plugin add cordova-plugin-camera@2.4.1 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Keyboard Plugin.\x1B[0m'
cordova plugin add ionic-plugin-keyboard@2.2.1 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Network Information Plugin.\x1B[0m'
cordova plugin add cordova-plugin-network-information@1.3.4 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Splashscreen Plugin.\x1B[0m'
cordova plugin add cordova-plugin-splashscreen@4.1.0 --nofetch --nosave >/dev/null 2>/dev/null

#echo '\x1B[0;90m✓ Installing Console Plugin.\x1B[0m'
#cordova plugin add cordova-plugin-console@1.1.0 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Statusbar Plugin.\x1B[0m'
cordova plugin add cordova-plugin-statusbar@2.3.0 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing File Plugin.\x1B[0m'
cordova plugin add cordova-plugin-file@4.3.3 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Dialogs Plugin.\x1B[0m'
cordova plugin add cordova-plugin-dialogs@1.3.4 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Compat Plugin.\x1B[0m'
cordova plugin add cordova-plugin-compat@1.2.0 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Document Viewer Plugin.\x1B[0m'
cordova plugin add cordova-plugin-document-viewer@0.8.1 --nofetch --nosave >/dev/null 2>/dev/null

#echo '\x1B[0;90m✓ Installing Privacyscreen Plugin.\x1B[0m'
#cordova plugin add cordova-plugin-privacyscreen@0.3.1 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Toast Plugin.\x1B[0m'
cordova plugin add cordova-plugin-x-toast@2.6.0 --nofetch --nosave >/dev/null 2>/dev/null

#echo '\x1B[0;90m✓ Installing Touch-Id Plugin.\x1B[0m'
#cordova plugin add cordova-plugin-touch-id@3.2.0 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing ActionSheet Plugin.\x1B[0m'
cordova plugin add cordova-plugin-actionsheet@2.3.3 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing oinio PDF Viewer Plugin.\x1B[0m'
cordova plugin add tools/plugin/cordova-plugin-pdf-viewer-1.1.1 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing smartconnector plugin\x1B[0m'
cordova plugin add tools/plugin/cordova-android-plugin.0.11.1.169 --nofetch --nosave >/dev/null 2>/dev/null

echo '\x1B[0;90m✓ Installing Push  (1.8.4)Plugin.\x1B[0m'
cordova plugin add phonegap-plugin-push@1.8.4  --nofetch --nosave --variable SENDER_ID='theIdFromGoogle' >/dev/null 2>/dev/null

echo '\x1B[0;32m✓ Adding Android platform to project.\x1B[0m'
cordova platform add android@7.0.0 --nofetch --nosave

echo '\x1B[0;32m✓ Adding SalesForce Cordova (6.1.0) Plugin.\x1B[0m'
cordova plugin add https://github.com/forcedotcom/SalesforceMobileSDK-CordovaPlugin#83649276e2bf2abe53951ee85ea6e8aeb5159479 --nofetch --nosave --force

echo '\x1B[0;90m✓ cordova-plugin-background-mode.\x1B[0m'
cordova plugin add cordova-plugin-background-mode

echo '\x1B[0;90m✓ cordova-plugin-baidumaplocation.\x1B[0m'
cordova plugin add cordova-plugin-baidumaplocation --variable ANDROID_KEY='gqNHAdSW0ORFLGF5IsGfuoM5DxhtSTiq' --variable IOS_KEY='IOS_KEY'

# Check salesforce sdk
if [ ! -d plugins/com.salesforce ]; then
    echo '\x1B[0;91mx SalesForce Cordova Plugin not correctly installed. Exiting here.\x1B[0m'
    exit
else
    echo '\x1B[0;32m✓ SalesForce Cordova Plugin seems to be installed.\x1B[0m'
fi

#echo '\x1B[0;32m✓ Create ionic resources.\x1B[0m'
#ionic cordova resources >/dev/null 2>/dev/null

echo '\x1B[0;32m✓ Prepare platform.\x1B[0m'
cordova prepare android >/dev/null 2>/dev/null