# Adding the Plugin

## Installing the plugin

Download the cordova-android-plugin zip file, and unzip into a suitable directory.

On the command line, navigate to the root of your Cordova project and install using:

```sh
$ cordova plugin add /path/to/cordova-android-plugin --nofetch
```

You can view the list of installed plugins using:

```sh
cordova plugin list
```

## Permissions

Bluetooth, bluetooth admin and coarse location permissions are also required. Your manifest file will automatically be updated to add these permissions when you install the plugin.

On Android 6 there was a change to the handling of permissions, namely the requirement to explicitly request certain permissions. See the 'Permissions' section of 'Using the Plugin' for more details.

# Updating the plugin

The easiest way to update the plugin is to first remove the old version and then install the new version.

Remove the plugin using:

``` sh
$ cordova plugin remove com.linde.scapp
```

An error may seen but can often be safely ignored if you can verify that the plugin has actually been removed by running:

```sh
cordova plugin list
```

And then install the new plugin as documented in 'Installing the plugin'.

# Using the plugin

The javascript interface to the plugin can be accessed as follows:

```javascript
var scapp;
scapp = cordova.plugins.scapp;
```

And functions executed as follows:

```javascript
function startDiscovery() {
    scapp.startDiscovery(   function(r){handleStartDiscovery(r)},
                            function(e){handleStartDiscovery(e)});
}

function handleStartDiscovery(data) {
    if (data.success) {
        // Discovery successfully started
    }
    else {
        // Discovery failed to start
    }
}
```

The full list of functions, their input parameters, and callback data formats are documented in www/scapp.js.

## Permissions

As stated previously, there was a change in the handling of permissions in Android 6. The 'diagnostic' plugin (included as a dependancy of this plugin) can be used to explicitly request the required ACCESS_COARSE_LOCATION permission, and an example of its use is given here:

```javascript
var diagnostic;
diagnostic = cordova.plugins.diagnostic;

function startPlugin() {
    permission = diagnostic.permission.ACCESS_COARSE_LOCATION;
    diagnostic.requestRuntimePermission(function(status) {
        switch(status) {
            case diagnostic.permissionStatus.GRANTED:
                console.log("Permission granted to use " + permission);
                scapp.startPlugin(function(r) {
                    handleStartPlugin(r);                                                            
                }, function(e) {
                    handleStartPlugin(e);                                                            
                })
                break;
            case diagnostic.permissionStatus.NOT_REQUESTED:
                alert("Permission to use " + permission + " has not been requested yet. Cannot start plugin");
                break;
            case diagnostic.permissionStatus.DENIED:
                alert("Permission denied to use " + permission + " - ask again?");
                break;
            case diagnostic.permissionStatus.DENIED_ALWAYS:
                alert("Permission permanently denied to use " + permission + " - cannot start plugin!");
                break;
        }
    }, function(error){
        console.error("The following error occurred: " + error);
    }, permission);
}
```
