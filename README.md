# Linde AVANTO

## Initial project setup

### Required libraries and clients
- node.js   8.9.2
- npm       5.5.1
- cordova   7.1.0
- ionic     3.19.0

### Required tools and SDK's
- Xcode 9 - downloadable form Apple App Store
- Enabled Developer Mode on Mac OSX
```
$ DevToolsSecurity -enable
```
- Xcode command line utilities
```
$ xcode-select --install
```
- [Android Studio](https://developer.android.com/studio/index.html) 3.0.1 
- Android SKD API Level 27 
- Android SDK Build-Tools 27.0.3 (install via Android SDK Manager)


### Setup Project Workspace

#### 1. Install node.js
Download and install node.js installation package from [nodejs.org](https://nodejs.org)

#### 2. Install cordova
Open terminal and install cordova and ionic globally via npm 
```
npm install -g cordova ionic 
```
> Please don't run *npm install* as super user (sudo). If you have permission problems, change the owner of you global node_module folder to fix the permissions
```
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### 3. Clone Repository
Clone the project from the corresponding repository (github.com / bitbucket.org) with your favourite git client or via terminal

#### 4. Initialize App Workspace 
> Due to OS compatibility reasons, it is highly recommended to create a seperate workspace fro each operating system 

#### iOS
Run initialize script to setup iOS project from terminal. The script downloads dependent npm packages and installs dependent cordova plugins
```
$ cd yourprojectfolder
$ sh tools/scripts/ios/initialize.sh
```

Xcode project is generated under `platforms/ios/[yourprojectname].xcodeproj`

#### Android
Prerequisite for Android is to set `ANDROID_HOME` path variable inside the project. Copy the `initialize.template.sh` script to `initialize.sh` 
```
$ cd yourprojectfolder
$ cp tools/scripts/android/initialize.template.sh tools/scripts/android/initialize.sh
$ vi tools/scripts/android/initialize.sh
```

Modify the following lines according your Android setup and set the correct path to your Android SDK
```
# Please configure the following three lines according to your individual setup and disable the following lines
#echo '\x1B[0;91mx PLEASE SET UP YOUR ANDROID_HOME PATH\x1B[0m'
#    exit
# after setting up your ANDROID_HOME, please disable until here
export ANDROID_HOME=/Users/myuser/Library/Android/sdk >/dev/null 2>/dev/null
```
to exit Vi, hit `ESC` and type `wq` to save and exit 

Run initialize script to setup Android project from terminal. The script downloads dependent npm packages and installs dependent cordova plugins
```
$ sh tools/scripts/android/initialize.sh
```

> Important on Android, please take a look on the log output of the initialize script. Only when the Salesforce Mobile SDK post install script was successfully executed, the Mobile SDK is installed correctly
```
Running SalesforceMobileSDK plugin android post-install script
Moving Salesforce libraries to the correct location
Fixing Gradle dependency paths in Salesforce libraries
Fixing root level Gradle file for the generated app
include ":SalesforceSDK"

include ":SmartStore"

include ":SmartSync"

include ":SalesforceHybrid"

Moving Gradle wrapper files to application directory
Fixing application build.gradle
allprojects {
	repositories {
		mavenCentral()
	}
}
Done running SalesforceMobileSDK plugin android post-install script
Fixing AndroidManifest.xml file for Salesforce SDK Plugin.
Fixed AndroidManifest.xml
```
Andnroid project is generated under `platforms/android`

#### Build optimization
It is possible to increase the gradle build performance. In case of slow gradle build processes, try modifying the `gradle-wrapper.properties` in your Android Project and add
```
org.gradle.parallel=true
org.gradle.daemon=true
org.gradle.jvmargs=-Xms256m -Xmx1024m
```

### Potential Project Issues
### iOS
#### 1. App doesn't show correct App icon and splachscreen
In some cases, the splashscreen and App icons are not placed in the correct location by the SalesforceMobile SDK. Please move the `Images.xcassets` from `platfomrs/ios/yourproject/Images.xcassets` to `platforms/ios/yourproject/Resources/Images.xcassets`

### Android
#### 1. Android Studio doesn't find the correct gradle version
Modify build.gradle (`/platforms/android/build.gradle`) of your Android Project and add `jcenter()` to the repositories and sync gradle again
```
buildscript {
	dependencies {
		classpath 'com.android.tools.build:gradle:2.3.2'
	}

    repositories {
        mavenCentral()
        jcenter()
    }
```
#### 2. App doesn't show correct App icon 
Double check the `android:icon` definition in your projects AndroidManifest.xml. android:icon should be `android:icon="@mipmap/icon"`
```XML
<application android:hardwareAccelerated="true" android:icon="@mipmap/icon" android:label="@string/app_name" android:manageSpaceActivity="com.salesforce.androidsdk.ui.ManageSpaceActivity" android:name="com.salesforce.androidsdk.phonegap.app.HybridApp">
```

#### 3. gradle build not succesfully
In some cases there is a version conflict with the generated gradle build and the locally installed libraries. This can be fixes with editing the dependencies in the app build.gradle
```
dependencies {
    implementation fileTree(dir: 'libs', include: '*.jar')
    // SUB-PROJECT DEPENDENCIES START
    api project(':SalesforceHybrid')
    compile "com.android.support:support-v4:27.1.0"
    compile "com.google.code.gson:gson:2.8.0"
    compile "com.android.support:support-v4:24.1.1+"
    compile "com.android.support:support-v13:23+"
    compile "com.google.android.gms:play-services-gcm:9.8+"
    compile "me.leolin:ShortcutBadger:1.1.4@aar"
    // SUB-PROJECT DEPENDENCIES END
}
```

#### 4. Not able to generate a release build
Some cordova plugins causes an error while creating a release build e.g.
```
 Error: The WIFI_SERVICE must be looked up on the Application context or memory will leak on devices < Android N. Try changing this.cordova.getActivity() to this.cordova.getActivity().getApplicationContext()  [WifiManagerLeak]
        WifiManager wifiManager = (WifiManager) this.cordova.getActivity().getSystemService(Context.WIFI_SERVICE);
```
In this case an updates an fixes cordova plugin has to be used. If this is not available, or the plugin has version conflicts with other plugins, the validation process while assembling the release app can be deactivated. 

Modify build.gradle (`/platforms/android/build.gradle`) of your Android Project, add the corresponding `lintOptions` and sync gradle again
```
android {
    lintOptions {
        checkReleaseBuilds false
    }
    ...
```
# Preparing Release Build
## 1. Version number
Before release a new App version, increase the version number in [config.xml](config.xml) and [package.json](package.json)

##### config.xml
```
<widget id="com.capgemini.linde.avanto.prod" version="1.2.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
```

##### package.json
```
    "name": "LINDE-TRUCK",
    "version": "1.0.0",
```

## 2. App ID
During the development phase, Capgemini uses an own certificate and App ID. To publish the Apps in App Stores, the App ID has to be changed to the live App ID.

To change the App ID, modify the [config.xml](config.xml)
```
<widget id="com.capgemini.linde.avanto.prod" version="1.2.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
```
> On Android an App ID change is not reflected with the normal cordova build `cordova prepare android`. The App ID is set at the initial Android project setup.

## 3. Certificate
To upload a release build into public App Stores, the App (iOS and Android) has to be singed with the customers certificate and (iOS) provisioning profile

## 4. Salesforce Connected App
During the development phase, a connected app from the Dev Sandbox is used. For production, the Connected App has to be changed to the production consumer key. Double check the Connected App consumer key in [bootconfig.json](www/bootconfig.json)
```
{
  "remoteAccessConsumerKey": "3MVG9LhmQQuck4iP2W_xx7.cCM36zGcFEXaDr43JpiFV_OjSD9dl45KwxXTurK7_bf_pJwedyaeoe0irhWDlL",
  "remoteAccessConsumerKeyDEV": "3MVG9lcxCTdG2VbtWAnBLcHTY.69LjnZC39eFhEC48uvDtpM0tOO8XNkDrNU9doSrRhtHEV68DDGRpu2MTcgC",
  "oauthRedirectURI": "http://localhost:8080/oauthcallback.html",
  "oauthScopes": [
    "web",
    "api"
  ],
  "isLocal": true,
  "startPage": "index.html",
  "errorPage": "error.html",
  "shouldAuthenticate": true,
  "attemptOfflineLoad": false
}
```

## 5. Salesforce Login Host
During the development phase, Salesforce Sandbox login host is used. For a production release, please double check the login hosts

App ID change is reflected by the cordova build `cordova prepare ios`. On iOS Production and Sandbox login hosts are included automatically by Salesforce Mobile SDK. It is not possible to remove them.

#### Android
On Android, the login hosts are defined in [servers.xml](platforms/android/SalesforceSDK/res/xml/servers.xml)
```
<servers>
    <server name="Production" url="https://login.salesforce.com"/>
    <server name="Sandbox" url="https://test.salesforce.com"/>
</servers>
```
The first server is used as default server. Production and Sandbox can be removed if no wanted.

## 6.make sure settings.gradle file  content
include ":"
include ":CordovaLib"
include ":app"
include ":SalesforceAnalytics"
include ":SalesforceSDK"
include ":SmartStore"
include ":SmartSync"
include ":SalesforceHybrid"

## 7.replace files
please copy jniLibs to src/main
please copy printer file and Printer.java to  src/main/java/com/capgemini/printDemo
please copy SingleService.java Utils.java MainActivity.java src/main/java/com/capgemini/lindetruck/pda
please copy AndroidManifest.xml to app path don't  copy to app/main