#!/bin/bash

MANIFEST=$(dirname "$0")/../../platforms/android/app/src/main/AndroidManifest.xml
[[ -e $MANIFEST ]] || { echo  "Manifest not found at $MANIFEST." ; exit 1; }

LINE='\(drawable\/sf__icon\)'
REPLACE='mipmap\/icon'
sed -i -e "s/${LINE}/${REPLACE}/g" $MANIFEST
